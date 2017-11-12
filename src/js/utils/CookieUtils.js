import cookie from "cookie";

import { userCookieKey } from "../constants/AuthConstants";

const Utils = {
  getUserMetadata() {
    if (cookie.parse(global.document.cookie)[userCookieKey] === undefined) {
      return null;
    }

    return JSON.parse(cookie.parse(global.document.cookie)[userCookieKey]);
  },
  emptyCookieWithExpiry(date) {
    console.log("empty user cookie");

    return cookie.serialize(userCookieKey, "", { expires: date });
  },
  setUserCookie(user, date) {
    global.document.cookie =
      userCookieKey +
      "=" +
      JSON.stringify({ is_remote: true, description: "new user", user, date });
  }
};

module.exports = Utils;
