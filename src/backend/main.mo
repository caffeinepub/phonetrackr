import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import Stripe "stripe/stripe";

actor {
  // Types
  public type PhoneStatus = { #active; #inactive; #pending };
  public type SubscriptionPlan = { #basic; #pro; #premium };

  public type TrackedNumber = {
    id : Nat;
    user : Principal;
    phoneNumber : Text;
    nickname : Text;
    dateAdded : Int;
    status : PhoneStatus;
  };

  public type TrackingEvent = {
    id : Nat;
    user : Principal;
    phoneNumber : Text;
    timestamp : Int;
    location : Text;
    eventType : Text;
  };

  public type UserProfile = { plan : SubscriptionPlan };

  public type AdminNotice = { message : Text; updatedAt : Int };

  public type AdminActivityEntry = {
    id : Nat;
    user : Principal;
    phoneNumber : Text;
    timestamp : Int;
    action : Text;
  };

  public type AdminStats = {
    totalUsers : Nat;
    totalTracks : Nat;
    totalEvents : Nat;
  };

  // State
  let trackedNumbers = Map.empty<Principal, Map.Map<Nat, TrackedNumber>>();
  let trackingHistory = Map.empty<Principal, Map.Map<Nat, TrackingEvent>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let activityLog = Map.empty<Nat, AdminActivityEntry>();

  var nextNumberId = 1;
  var nextEventId = 1;
  var nextActivityId = 1;
  var adminNotice : ?AdminNotice = null;

  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  module TrackedNumber {
    public func compare(a : TrackedNumber, b : TrackedNumber) : Order.Order {
      Int.compare(a.dateAdded, b.dateAdded);
    };
  };

  module TrackingEvent {
    public func compare(a : TrackingEvent, b : TrackingEvent) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  module AdminActivityEntry {
    public func compare(a : AdminActivityEntry, b : AdminActivityEntry) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  // Admin Notice Functions
  public shared ({ caller }) func setAdminNotice(message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set admin notices");
    };
    adminNotice := ?{ message; updatedAt = Time.now() };
  };

  public query ({ caller }) func getAdminNotice() : async ?AdminNotice {
    adminNotice;
  };

  // Profile Management Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func getCallerUserProfileHelper(caller : Principal) : UserProfile {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) {
        let newProfile = { plan = #basic };
        userProfiles.add(caller, newProfile);
        newProfile;
      };
    };
  };

  func setCallerUserProfileHelper(caller : Principal, profile : UserProfile) : () {
    userProfiles.add(caller, profile);
  };

  // Subscription Management
  public shared ({ caller }) func getSubscriptionPlan() : async SubscriptionPlan {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access subscription plans");
    };
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.plan };
      case (null) { #basic };
    };
  };

  public shared ({ caller }) func setSubscriptionPlan(plan : SubscriptionPlan) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update subscription plans");
    };
    let profile = switch (userProfiles.get(caller)) {
      case (?p) { p };
      case (null) { { plan = #basic } };
    };
    let updatedProfile = { profile with plan };
    userProfiles.add(caller, updatedProfile);
  };

  func canAddNumber(plan : SubscriptionPlan, count : Nat) : () {
    let maxAllowed = switch (plan) {
      case (#basic) { 2 };
      case (#pro) { 10 };
      case (#premium) { 1_000_000_000 };
    };

    if (count >= maxAllowed) {
      Runtime.trap("Amount limit reached for current subscription plan");
    };
  };

  // Tracked Numbers Management
  public shared ({ caller }) func addTrackedNumber(phoneNumber : Text, nickname : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add tracked numbers");
    };

    let profile = getCallerUserProfileHelper(caller);
    let count = getTrackedNumbersHelper(caller).size();
    canAddNumber(profile.plan, count);

    let newNumber : TrackedNumber = {
      id = nextNumberId;
      user = caller;
      phoneNumber;
      nickname;
      dateAdded = Time.now();
      status = #pending;
    };

    let activityEntry = {
      id = nextActivityId;
      user = caller;
      phoneNumber;
      timestamp = Time.now();
      action = "track";
    };
    activityLog.add(nextActivityId, activityEntry);
    nextActivityId += 1;

    let userNumbers = getTrackedNumbersHelper(caller);
    userNumbers.add(nextNumberId, newNumber);
    if (not trackedNumbers.containsKey(caller)) {
      trackedNumbers.add(caller, userNumbers);
    };

    nextNumberId += 1;
    newNumber.id;
  };

  public query ({ caller }) func getTrackedNumbers() : async [TrackedNumber] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tracked numbers");
    };

    getTrackedNumbersHelper(caller).values().toArray().sort();
  };

  public shared ({ caller }) func removeTrackedNumber(numberId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove tracked numbers");
    };

    let userNumbers = getTrackedNumbersHelper(caller);
    if (not userNumbers.containsKey(numberId)) {
      Runtime.trap("Tracked number not found");
    };
    userNumbers.remove(numberId);
  };

  public shared ({ caller }) func updateNumberStatus(numberId : Nat, status : PhoneStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update number status");
    };

    let userNumbers = getTrackedNumbersHelper(caller);
    let current = switch (userNumbers.get(numberId)) {
      case (?number) { number };
      case (null) { Runtime.trap("Tracked number not found") };
    };
    let newNumber = { current with status };
    userNumbers.add(numberId, newNumber);
  };

  // Tracking Events / History
  public shared ({ caller }) func addTrackingEvent(numberId : Nat, location : Text, eventType : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add tracking events");
    };

    let numbers = getTrackedNumbersHelper(caller);

    let number = switch (numbers.get(numberId)) {
      case (?number) { number };
      case (null) { Runtime.trap("Tracked number not found") };
    };

    let newEvent : TrackingEvent = {
      id = nextEventId;
      user = caller;
      phoneNumber = number.phoneNumber;
      timestamp = Time.now();
      location;
      eventType;
    };

    let activityEntry = {
      id = nextActivityId;
      user = caller;
      phoneNumber = number.phoneNumber;
      timestamp = Time.now();
      action = "event";
    };
    activityLog.add(nextActivityId, activityEntry);
    nextActivityId += 1;

    let userEvents = getTrackingEventsHelper(caller);
    userEvents.add(nextEventId, newEvent);
    if (not trackingHistory.containsKey(caller)) {
      trackingHistory.add(caller, userEvents);
    };

    nextEventId += 1;
    newEvent.id;
  };

  public query ({ caller }) func getNumberHistory(numberId : Nat) : async [TrackingEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tracking history");
    };

    let numbers = getTrackedNumbersHelper(caller);
    let number = switch (numbers.get(numberId)) {
      case (?number) { number };
      case (null) { Runtime.trap("Tracked number not found") };
    };

    getTrackingEventsHelper(caller).values().toArray().filter(func(event) { event.phoneNumber == number.phoneNumber }).sort();
  };

  public query ({ caller }) func getFullHistory() : async [TrackingEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tracking history");
    };

    getTrackingEventsHelper(caller).values().toArray().sort();
  };

  // Helper functions
  func getTrackedNumbersHelper(caller : Principal) : Map.Map<Nat, TrackedNumber> {
    switch (trackedNumbers.get(caller)) {
      case (?numbers) { numbers };
      case (null) {
        let numbers = Map.empty<Nat, TrackedNumber>();
        trackedNumbers.add(caller, numbers);
        numbers;
      };
    };
  };

  func getTrackingEventsHelper(caller : Principal) : Map.Map<Nat, TrackingEvent> {
    switch (trackingHistory.get(caller)) {
      case (?events) { events };
      case (null) {
        let events = Map.empty<Nat, TrackingEvent>();
        trackingHistory.add(caller, events);
        events;
      };
    };
  };

  // Stripe Integration
  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfig := ?config;
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?config) { config };
    };
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  // Admin Dashboard Functions
  public query ({ caller }) func getAdminStats() : async AdminStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access stats");
    };

    let totalUsers = userProfiles.size();
    var totalTracks = 0;
    var totalEvents = 0;

    for ((_, userNumbers) in trackedNumbers.entries()) {
      totalTracks += userNumbers.size();
    };

    for ((_, userEvents) in trackingHistory.entries()) {
      totalEvents += userEvents.size();
    };

    {
      totalUsers;
      totalTracks;
      totalEvents;
    };
  };

  public query ({ caller }) func getAllTrackedNumbers() : async [TrackedNumber] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access all tracked numbers");
    };

    let allTrackedNumbersIter = trackedNumbers.entries();
    let allTrackedNumbersArray = allTrackedNumbersIter.toArray();
    let resultArray = allTrackedNumbersArray.foldLeft(
      Array.empty<TrackedNumber>(),
      func(acc, entry) {
        let (principal, numberMap) = entry;
        let valuesArray = numberMap.values().toArray();
        acc.concat(valuesArray);
      },
    );
    resultArray;
  };

  func getAllActivityIter() : Iter.Iter<AdminActivityEntry> {
    activityLog.values();
  };

  public query ({ caller }) func getAllActivity(limit : Nat) : async [AdminActivityEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access all activity");
    };

    let sorted = getAllActivityIter().toArray().sort();
    let limited = Iter.fromArray(sorted).take(limit);
    limited.toArray();
  };

  public query ({ caller }) func getAllUsers() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access all users");
    };

    userProfiles.keys().toArray();
  };
};
