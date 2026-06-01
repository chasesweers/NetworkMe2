Feature: Connection Store

  Scenario: Load connections
    Given the store is empty
    When setConnections is called with a list of connections
    Then the store holds those connections

  Scenario: Clear connections
    Given the store has connections
    When clearConnections is called
    Then the connections array is empty

  Scenario: Toggle favorite
    Given a connection key "alex__acme"
    When toggleFavorite is called once
    Then isFavorite returns true
    When toggleFavorite is called again
    Then isFavorite returns false

  Scenario: Filter by search query
    Given connections for "Alex Rivera" at "Acme" and "Jordan Lee" at "Startup"
    When searchQuery is set to "jordan"
    Then filteredConnections returns only Jordan Lee

  Scenario: Filter by company
    Given connections at "Acme Corp" and "Startup Inc"
    When the company filter is set to "Acme"
    Then filteredConnections returns only Acme Corp connections

  Scenario: Filter favorites only
    Given two connections where only one is favorited
    When favoritesOnly filter is enabled
    Then filteredConnections returns only the favorited connection

## Integration Coverage
- Component: <SearchView> renders filtered list when search query changes
- Component: favorite toggle button updates star icon state

## E2E Coverage
- Playwright: user types in search box, list narrows in real browser
- Playwright: user clicks favorite star, connection persists as favorite after page reload
