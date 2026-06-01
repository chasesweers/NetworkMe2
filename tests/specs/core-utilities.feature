Feature: Core Utility Functions

  Scenario: Generate person key from connection
    Given a connection with name "Alex Rivera" and company "Acme Corp"
    When personKey is called
    Then it returns a lowercase underscore-safe string unique to that person+company

  Scenario: Canonical pair ordering
    Given two person keys "zebra" and "apple"
    When canonPair is called
    Then the pair is always returned in alphabetical order regardless of input order

  Scenario: Parse a valid LinkedIn CSV
    Given a CSV string with header row and data rows
    When parseCSV is called
    Then it returns an array of Connection objects with correct fields

  Scenario: Handle quoted CSV fields with commas
    Given a CSV line where a field contains a comma inside quotes
    When splitCSVLine is called
    Then the quoted field is returned as a single string including the comma

  Scenario: Format a date string
    Given an ISO date string "2023-01-15"
    When formatDate is called
    Then it returns a human-readable string like "Jan 15, 2023"

  Scenario: Generate initials from a name
    Given a full name "Alex Rivera"
    When initials is called
    Then it returns "AR"

## Integration Coverage
- No component integration needed — pure functions

## E2E Coverage
- N/A — pure functions are fully covered by unit tests
