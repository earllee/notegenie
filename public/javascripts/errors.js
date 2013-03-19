// adapted from https://github.com/dropbox/dropbox-js/blob/master/doc/getting_started.md

var showError = function(error) {
  switch (error.status) {
  case Dropbox.ApiError.INVALID_TOKEN:
    // If you're using dropbox.js, the only cause behind this error is that
    // the user token expired.
    // Get the user through the authentication flow again.
    client.reset();
    setupAlert(null, null, null, 'Dropbox log in expired: please try logging in again or clearing your cookies');
    $('[id="alertBox"]').fadeIn();
    break;

  case Dropbox.ApiError.NOT_FOUND:
    // The file or folder you tried to access is not in the user's Dropbox.
    // Handling this error is specific to your application.
    setupAlert(null, null, null, 'Error opening the file or folder requested. Make sure the folder apps/NoteGenie exists, and try saving to a different file name.');
    $('[id="alertBox"]').fadeIn();
    break;

  case Dropbox.ApiError.OVER_QUOTA:
    // The user is over their Dropbox quota.
    // Tell them their Dropbox is full. Refreshing the page won't help.
    setupAlert(null, null, null, 'Error saving file: your dropbox is full. Free up space on your account before saving files with NoteGenie');
    $('[id="alertBox"]').fadeIn();
    break;

  case Dropbox.ApiError.RATE_LIMITED:
    // Too many API requests. Tell the user to try again later.
    // Long-term, optimize your code to use fewer API calls.
    setupAlert(null, null, null, 'Error making connection to Dropbox. Please try again later.');
    $('[id="alertBox"]').fadeIn();
    break;

  case Dropbox.ApiError.NETWORK_ERROR:
    // An error occurred at the XMLHttpRequest layer.
    // Most likely, the user's network connection is down.
    // API calls will not succeed until the user gets back online.
    setupAlert(null, null, null, 'Error connecting to dropbox-- check network connection and try again');
    $('[id="alertBox"]').fadeIn();
    break;

  case Dropbox.ApiError.INVALID_PARAM:
    setupAlert(null, null, null, 'Invalid param. Please contact Earl and Shenil about this error.');
    $('[id="alertBox"]').fadeIn();
    break;
  case Dropbox.ApiError.OAUTH_ERROR:
    setupAlert(null, null, null, 'Authentication error. Please make sure you allow NoteGenie access to your Dropbox.');
    $('[id="alertBox"]').fadeIn();
    break;
  case Dropbox.ApiError.INVALID_METHOD:
    setupAlert(null, null, null, 'Invalid method. Please contact Earl and Shenil about this error.');
    $('[id="alertBox"]').fadeIn();
    break;
  default:
    // Caused by a bug in dropbox.js, in your application, or in Dropbox.
    // Tell the user an error occurred, ask them to refresh the page.
    setupAlert(null, null, null, 'An error connecting to Dropbox has occurred. Please try refreshing the page and logging in again. If problems persist, contact Earl and Shenil.');
    $('[id="alertBox"]').fadeIn();
    break;
  }
};
