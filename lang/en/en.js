// Disclosure: I used ChatGPT to assist with the content of this assignment.


module.exports = {
  errors: {
    invalidInput: 'Invalid input. Please enter a valid word and definition.',
    wordNotFound: "Word '%1' not found!",
    wordExists: "Warning! '%1' already exists.",
    endpointNotFound: 'Endpoint not found',
    noPatientData: 'No patient data provided',
    insertError: 'Error inserting data: %1',
    missingQuery: 'SQL query parameter is missing',
    sqlForbidden: 'DROP, DELETE and UPDATE are not allowed',
    sqlError: 'Error executing SQL query: %1'
  },
  success: {
    newEntryRecorded: 'Request# %3\nNew entry recorded:\n"%1: %2"',
    dataInserted: 'Data inserted successfully',
    dataRetrieved: 'Data retrieved successfully',
  }
};




