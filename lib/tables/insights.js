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
/**
 @module insight
 @table insights
**/
var schema = require('../schema')

module.exports = schema.create('table', {
  name        : 'insights',
  permissions : ['access_token', 'read_insights'],
  fields      : {
    "object_id" : {
      indexable   : true,
      type        : 'int',
      length      : 255,
      description : "The object for which you are retrieving metrics."
    },

    "metric" : {
      indexable   : true,
      type        : 'string',
      length      : 255,
      description : "The usage data to retrieve."
    },

    "end_time" : {
      indexable   : true,
      type        : 'int',
      length      : 255,
      description : ["The end of the period during which the metrics were collected,", 
                     "expressed as a unix time (which should always be midnight, Pacific Daylight Time)",
                     "or using the function end_time_date() which takes a date string in 'YYYY-MM-DD' format.",
                     "Note: If the unix time provided is not midnight, Pacific Daylight Time, your query may return an empty resultset.",
                     "Example: To obtain data for the 24-hour period starting on September 15th at 00:00 (i.e. 12:00 midnight)",
                     "and ending on September 16th at 00:00 (i.e. 12:00 midnight),",
                     "specify 1284620400 as the end_time and 86400 as the period.",
                     "",
                     "Note: end_time should not be specified when querying lifetime metrics."].join('\n')
    },

    "period" : {
      indexable   : true,
      type        : 'int',
      length      : 255,
      description : ["The length of the period during which the metrics were collected,",
                     "expressed in seconds as one of 86400 (day), 604800 (week),",
                     "2592000 (month) or 0 (lifetime) or using the function period(),",
                     "which takes one of the strings day, week, month or lifetime.",
                     "",
                     "Note: Each metric may not have all periods available."].join('\n')
    },

    "value" : {
      type        : 'mixed',
      length      : 500,
      description : "The value of the requested metric."
    },
  }
})
