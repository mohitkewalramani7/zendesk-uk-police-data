// React Imports
import { useEffect, useState } from 'react'
import { useClient } from '../hooks/useClient'

// Zendesk Garden Library Imports
import { Alert, Well } from '@zendeskgarden/react-notifications';
import { Button } from '@zendeskgarden/react-buttons';
import { DatePicker } from '@zendeskgarden/react-datepickers';
import { Field, Input } from '@zendeskgarden/react-forms';
import { Inline } from '@zendeskgarden/react-loaders';
import { Menu, Item } from '@zendeskgarden/react-dropdowns';
import { Table } from '@zendeskgarden/react-tables';

// Zendesk Garden Theme Imports
import { ThemeProvider, DEFAULT_THEME } from '@zendeskgarden/react-theming'


const TicketSideBar = () => {
  const client = useClient()

  // Date related fields (step 1)
  const todaysDate = new Date()
  const [dateValue, setDateValue] = useState(new Date())

  // Crime category hooks (step 2)
  const [crimeCategories, setCrimeCategories] = useState({})
  const [selectedCrimeCategory, setSelectedCrimeCategory] = useState(null)

  // Forces related hooks (areas of police) (step 3)
  const [forcesList, setForcesList] = useState({})
  const [selectedForce, setSelectedForce] = useState(null)

  // Search result hook (final step 4)
  const [searchResults, setSearchResults] = useState(null)

  // Loading dots hooks
  const [showCategoryLoadingDots, setShowCategoryLoadingDots] = useState(false)
  const [showForcesLoadingDots, setShowForcesLoadingDots] = useState(false)
  const [showSearchResultsLoadingDots, setShowSearchResultsLoadingDots] = useState(false)

  // Banners for errors
  const [showApiErrorDialog, setShowApiErrorDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)

  // ------------------------------------------ Use Effects ------------------------------------------

  // Init
  useEffect(() => {
    (async () => {
      client.invoke('resize', { width: '100%', height: '550px' })
    })()
  }, [])

  // Hook to track changes in category, which will trigger a call to getForcesList()
  useEffect(() => {
    if (selectedCrimeCategory) {
      getForcesList()
    }
  }, [selectedCrimeCategory])

  // ------------------------------------------ Helper Methods ------------------------------------------

  // Checks for valid date from our date picker (step 1)
  const isDateValid = () => {
    return dateValue <= todaysDate
  }

  // Callback method once a crime category is selected (step 2)
  const onCategorySelect = (category) => {
    if (category.value) {
      setSelectedCrimeCategory(category.value)
    }
  }

  // Helper method to determine if we should show the search button
  const showSearchButton = () => {
    return selectedCrimeCategory != null && selectedForce != null
  }

  // Callback method used to set police force value once selected (step 3)
  const onForceSelect = (force) => {
    if (force.value) {
      setSelectedForce(force.value)
    }
  }

  // Callback method used when the search crime button has been clicked (step 4)
  const searchCrimeButtonClick = () => {
    searchCrimes(dateValue.toISOString().slice(0, 7), selectedCrimeCategory, selectedForce)
  }

  // Helper method to render dots as required through the component
  const renderLoadingDots = () => {
    return <Inline size={32} delayMS={0} className="dots-spacing" /> 
  }

  // ------------------------------------- Methods used for API Callouts -------------------------------------

  // Callout for categories (step 2)
  async function getCrimeCategories() {
    setShowCategoryLoadingDots(true)
    try {
      const eventRequestOptions = {
        url: `https://data.police.uk/api/crime-categories?date=2024-01`,
      }
      const response = await client.request(eventRequestOptions)
      let categoriesObject = {}
      response.forEach(category => {
        categoriesObject[category.url] = category.name
      })
      setCrimeCategories(categoriesObject)
    }
    catch(exception) {
      setShowApiErrorDialog(true)
    }
    setShowCategoryLoadingDots(false)
  }

  // Callout for forces (step 2)
  async function getForcesList() {
    setShowForcesLoadingDots(true)
    try {
      const eventRequestOptions = {
        url: `https://data.police.uk/api/forces`,
      }
      const response = await client.request(eventRequestOptions)
      let forcesObject = {}
      response.forEach(force => {
        forcesObject[force.id] = force.name
      })
      setForcesList(forcesObject)
    }
    catch(exception) {
      setShowApiErrorDialog(true)
    }
    setShowForcesLoadingDots(false)
  }

  // Callout for search results (step 3)
  async function searchCrimes(dateString, crimeString, forceString) {
    setShowErrorDialog(false)
    setShowSearchResultsLoadingDots(true)
    const eventRequestOptions = {
      url: `https://data.police.uk/api/crimes-no-location?category=${crimeString}&date=${dateString}&force=${forceString}`,
    }
    try {
      const response = await client.request(eventRequestOptions)
      parseSearchResults(response)
    }
    catch (exception) {
      setShowErrorDialog(true)
      setSearchResults(null)
    }
    const element = document.getElementById("anchor");
    element.scrollIntoView({behavior: 'smooth', block: 'start'})
    setShowSearchResultsLoadingDots(false)
  }

  // Helper method to parse search results
  function parseSearchResults(searchResults) {
    let parsedSearchResults = searchResults.map(searchResult => ({
      investigationOutcome: searchResult?.outcome_status?.category,
      outcomeDate: searchResult?.outcome_status?.date,
      monthsToResolution: Math.abs(searchResult?.outcome_status?.date?.split('-')[1] - searchResult.month.split('-')[1])
    }))
    setSearchResults(parsedSearchResults)
  }

  // ---------------------------------------------------------------------------------------------------------------

  return (
    <ThemeProvider theme={{ ...DEFAULT_THEME }}>
      <h1>UK Police Data</h1>
      <Well>
        {/**************************** Step 1 - Set Date ****************************/}
        <Field.Label>Select a date</Field.Label>
        <DatePicker value={dateValue} onChange={setDateValue} maxValue={todaysDate} isCompact>
          <Input validation={isDateValid() ? undefined : 'error'} />
        </DatePicker>
        {!isDateValid() ? <Field.Message validation="error">
          Please Select a Date Before or Equal to Today</Field.Message> : null}
        {/**************************** Step 2 - Search Categories ****************************/}
        <Button isPrimary isStretched className="button-margin" disabled={!isDateValid()} onClick={getCrimeCategories}>
          {showCategoryLoadingDots ? renderLoadingDots() : 'Search Crime Categories'}
        </Button>
        {Object.keys(crimeCategories).length > 0 ? <Menu button="Please Select a Crime Category" onChange={onCategorySelect}>
          {Object.keys(crimeCategories).map(url => <Item value={url}>{crimeCategories[url]}</Item>)}
        </Menu> : null}
        {selectedCrimeCategory ? <Field className="input-field">
          <Field.Label>Selected Category</Field.Label>
          <Input value={crimeCategories[selectedCrimeCategory]} disabled />
        </Field> : null}
      </Well>
      {/**************************** Step 3 - Search Forces ****************************/}
      {showForcesLoadingDots ? renderLoadingDots() : null}
      {Object.keys(forcesList).length > 0 ? <Well className="well-spacing">
        <Menu button="Please Select a Force" onChange={onForceSelect} className="button-margin">
          {Object.keys(forcesList).map(id => <Item value={id}>{forcesList[id]}</Item>)}
        </Menu>
        {selectedForce ? <Field className="input-field">
          <Field.Label>Selected Category</Field.Label>
          <Input value={forcesList[selectedForce]} disabled />
        </Field> : null}
      </Well> : null}
      {/**************************** Step 4 - Search Results ****************************/}
      {showSearchButton() ? <Button id="anchor" isPrimary isStretched className="button-margin" onClick={searchCrimeButtonClick}>
        {showSearchResultsLoadingDots ? renderLoadingDots() : 'Search'}
      </Button> : null}
      {/**************************** Display Search Results in Table or Appropriate Banner ****************************/}
      {searchResults?.length > 0 ? <div>
        <Alert type="success" className="notification-banners">
          <Alert.Title>Info</Alert.Title>
          {`${searchResults?.length} Search Results`}
          </Alert>
        <Table>
          <Table.Head>
            <Table.HeaderRow>
              <Table.HeaderCell>Investigation Outcome</Table.HeaderCell>
              <Table.HeaderCell>Outcome Month</Table.HeaderCell>
              <Table.HeaderCell>Months to Resolution</Table.HeaderCell>
            </Table.HeaderRow>
          </Table.Head>
          <Table.Body>
            {searchResults.map(searchResult =>
              <Table.Row>
                <Table.Cell>{searchResult.investigationOutcome}</Table.Cell>
                <Table.Cell>{searchResult.outcomeDate}</Table.Cell>
                <Table.Cell>{searchResult.monthsToResolution}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div> : null}
      {/**************************** Error/Warning Banners for User ****************************/}
      {searchResults?.length === 0 ? <Alert type="warning" className="notification-banners">
      <Alert.Title>No Results</Alert.Title>
        No search results found for this criteria
      </Alert> : null}
      {showErrorDialog ? <Alert type="error" className="notification-banners">
      <Alert.Title>No Data</Alert.Title>
        No data available for this date
      </Alert> : null}
      {showApiErrorDialog ? <Alert type="error" className="notification-banners">
      <Alert.Title>Site Error</Alert.Title>
        Error Accessing API, please try again later
      </Alert> : null}
    </ThemeProvider>
  )
}

export default TicketSideBar;
