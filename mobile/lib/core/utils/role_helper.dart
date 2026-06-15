class RoleHelper {
  RoleHelper._();

  static bool canAccessFinance(String role) =>
      {'super_admin', 'head_pastor', 'finance_officer'}.contains(role);

  static bool canAccessPastoral(String role) => {
        'super_admin',
        'head_pastor',
        'associate_pastor',
        'branch_pastor',
        'care_leader',
      }.contains(role);

  static bool canAccessHQ(String role) =>
      {'super_admin', 'head_pastor', 'associate_pastor'}.contains(role);

  static bool canSendBroadcast(String role) => {
        'super_admin',
        'head_pastor',
        'associate_pastor',
        'media_team',
      }.contains(role);

  static bool canManageVolunteers(String role) => {
        'super_admin',
        'head_pastor',
        'associate_pastor',
        'branch_pastor',
        'volunteer_leader',
      }.contains(role);

  static bool canAccessMinistry(String role) => {
        'super_admin',
        'head_pastor',
        'associate_pastor',
        'branch_pastor',
        'volunteer_leader',
      }.contains(role);

  static bool canAccessCBS(String role) => {
        'super_admin',
        'head_pastor',
        'associate_pastor',
        'branch_pastor',
        'care_leader',
        'cbs_leader',
      }.contains(role);

  static bool canAccessStrategicMobile(String role) =>
      {'super_admin', 'head_pastor'}.contains(role);

  static bool canAccessLeadershipMobile(String role) =>
      {'super_admin', 'head_pastor'}.contains(role);

  static bool isLeader(String role) => {
        'super_admin',
        'head_pastor',
        'associate_pastor',
        'branch_pastor',
        'care_leader',
        'volunteer_leader',
        'cbs_leader',
        'finance_officer',
        'media_team',
      }.contains(role);

  static bool isPastor(String role) =>
      {'super_admin', 'head_pastor', 'associate_pastor', 'branch_pastor'}
          .contains(role);

  static bool isMember(String role) => !isLeader(role);
}
