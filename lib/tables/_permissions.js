/*
 * FQL-Workbench
 * Copyright 2012 Joseph Werle (joseph.werle@gmail.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = {
  basic : [
    'id', 'name', 'first_name', 'last_name', 
    'link', 'username', 'gender', 'local'
  ], 

  extended : [
    "read_friendlists",     "read_insights",        "read_mailbox", 
    "read_requests",        "read_stream",          "xmpp_login", 
    "ads_management",       "create_event",         "manage_friendlists",
    "manage_notifications", "user_online_presence", "friends_online_presence",
    "publish_checkins",     "publish_stream",       "rsvp_event"
  ],

  graph : [
    "publish_actions",    "user_actions.music",           "user_actions.news", 
    "user_actions.video", "user_actions:$APP_NAMESPACE",  "user_games_activity"
  ],

  page : [
    "manage_pages"
  ],

  'user-friend' : [
    "user_about_me",              "user_activities",          "user_birthday", 
    "user_checkins",              "user_education_history",   "user_events", 
    "user_groups",                "user_hometown",            "user_interests", 
    "user_likes",                 "user_location",            "user_notes",
    "user_photos",                "user_questions",           "user_relationships", 
    "user_relationship_details",  "user_religion_politics",   "user_status", 
    "user_subscriptions",         "user_videos",              "user_website", 
    "user_work_history",          "email",                    "friends_about_me", 
    "friends_activities",         "friends_birthday",         "friends_checkins", 
    "friends_education_history",  "friends_events",           "friends_groups", 
    "friends_hometown",           "friends_interests",        "friends_likes", 
    "friends_location",           "friends_notes",            "friends_photos", 
    "friends_questions",          "friends_relationships",    "friends_relationship_details", 
    "friends_religion_politics",  "friends_status",           "friends_subscriptions", 
    "friends_videos",             "friends_website",          "friends_work_history"
  ]


};


/**
Array.prototype.map.apply($0.children, [function(el) { 
  return Array.prototype.map.apply(el.querySelectorAll('td code'), [function(el, i, col) { 
    return el.innerText
  }]).join(',')
}]).join(',').split(',')

**/



