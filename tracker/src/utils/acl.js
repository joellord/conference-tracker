let permissions = [];

const PERMISSIONS = {
  CONFERENCE: {
    LIST: "conference:list",
    SUBMIT: "conference:submit",
    ADD: "conference:add",
    DETAILS: "conference:details",
    SUBMISSIONS: "conference:submissions"
  },
  MEETUP: {
    LIST: "meetup:list",
    FIND: "meetup:find",
    DETAILS: "meetup:details"
  },
  UPCOMING: {
    LIST: "upcoming:list"
  },
  TALK: {
    LIST: "talk:list"
  },
  REPORT: {
    DUE: "report:due",
    ADD: "report:add"
  },
  STATS: {
    READ: "stats:read"
  },
  PROFILE: {
    ALL: "profile:all"
  },
  ROLE: {
    AMBASSADOR: "role:ambassador",
    EVANGELIST: "role:evangelist",
    MANAGER: "role:manager",
    SALES: "role:sales"
  }
};

const setPermissions = (newPermissions) => {
  permissions = newPermissions;
  return permissions;
};

const isGuest = () => !permissions.length;

const isPermissionEnabled = permission => permissions.indexOf(permission) > -1;

// eslint-disable-next-line arrow-body-style
const getNavbarPermissions = () => {
  return {
    showConferenceLink: isPermissionEnabled(PERMISSIONS.CONFERENCE.LIST),
    showMeetupLink: isPermissionEnabled(PERMISSIONS.MEETUP.LIST),
    showUpcomingLink: isPermissionEnabled(PERMISSIONS.UPCOMING.LIST),
    showTalkLink: isPermissionEnabled(PERMISSIONS.TALK.LIST),
    showReportLink: isPermissionEnabled(PERMISSIONS.REPORT.ADD) || isPermissionEnabled(PERMISSIONS.REPORT.DUE),
    showStatLink: isPermissionEnabled(PERMISSIONS.STATS.READ),
    showProfileLink: isPermissionEnabled(PERMISSIONS.PROFILE.ALL)
  };
};

export {
  PERMISSIONS,
  isPermissionEnabled,
  setPermissions,
  isGuest,
  getNavbarPermissions
};
