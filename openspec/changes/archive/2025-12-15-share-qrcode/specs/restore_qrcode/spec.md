# Spec: Share Modal QR Codes

## ADDED Requirements

#### Scenario: Displaying QR Codes in Share Dialog
Given the user is viewing a map
When the user clicks the "Share" button
Then the Share modal opens
And the modal displays a QR code for the "App URL" (base application)
And the modal displays a QR code for the "View URL" (current map view)
And scanning the App URL QR code opens the application at the default state
And the modal displays a "Copy URL" button
And clicking "Copy URL" copies the current View URL to the clipboard
And clicking "Copy URL" displays a temporary "URL copied" toast notification
And the modal displays a "Twitter" button
And clicking "Twitter" opens a Twitter share intent with the current URL
And the modal displays a "Facebook" button
And clicking "Facebook" opens a Facebook share intent with the current URL


