/**
* Helper to convert snake case strings to sentence case
* @param {String} string Snake case string
* @return {String} Sentence case string
*/
export function toSentenceCase (string) {
  const finalString = string.replace(/_/g, ' ')
  return finalString.charAt(0).toUpperCase() + finalString.slice(1)
}

/**
* Helper to format ISO 8601 timestamps as human-readable datetime
* @param {String} date ISO 8601 timestamp
* @return {String} Formatted date. Example: Sep 1, 2099 2:55 PM
*/
export function formatDate (date) {
  const formattedDate = new Date(date)
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }
  return formattedDate.toLocaleDateString('en-us', options)
}