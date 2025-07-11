import { useEffect, useState } from 'react'
import { useClient } from '../hooks/useClient'

import { Button } from '@zendeskgarden/react-buttons';
import { DatePicker } from '@zendeskgarden/react-datepickers';
import { Field, Input } from '@zendeskgarden/react-forms';
import { Menu, Item } from '@zendeskgarden/react-dropdowns';
import { Table } from '@zendeskgarden/react-tables';
import { Alert, Well } from '@zendeskgarden/react-notifications';

import { PALETTE } from '@zendeskgarden/react-theming';
import { Dots } from '@zendeskgarden/react-loaders';
import { ThemeProvider, DEFAULT_THEME } from '@zendeskgarden/react-theming'


const TicketSideBar = () => {
  const client = useClient()
  const todaysDate = new Date()

  const [dateValue, setDateValue] = useState(new Date())

  const [showLoadingDots, setShowLoadingDots] = useState(false)

  const [showApiErrorDialog, setShowApiErrorDialog] = useState(false)

  const [crimeCategories, setCrimeCategories] = useState({})
  const [selectedCrimeCategory, setSelectedCrimeCategory] = useState(null)

  const [forcesList, setForcesList] = useState({})
  const [selectedForce, setSelectedForce] = useState(null)

  const [searchResults, setSearchResults] = useState(null)
  const [showErrorDialog, setShowErrorDialog] = useState(false)

  useEffect(() => {
    (async () => {
      client.invoke('resize', { width: '100%', height: '550px' })
    })()
  }, [])

  useEffect(() => {
    if (showLoadingDots) {
      const element = document.getElementById("anchor");
      element.scrollIntoView({behavior: 'smooth', block: 'start'})
    }
  }, [showLoadingDots])

  useEffect(() => {
    if (selectedCrimeCategory) {
      getForcesList()
    }
  }, [selectedCrimeCategory])

  const isDateValid = () => {
    return dateValue <= todaysDate
  }

  const onCategorySelect = (category) => {
    if (category.value) {
      setSelectedCrimeCategory(category.value)
    }
  }

  const showSearchButton = () => {
    return selectedCrimeCategory != null && selectedForce != null
  }

  const onForceSelect = (force) => {
    if (force.value) {
      setSelectedForce(force.value)
      if (searchResults === null) {
        searchCrimes(dateValue.toISOString().slice(0, 7), selectedCrimeCategory, force.value)
      }
    }
  }

  const searchCrimeButtonClick = () => {
    searchCrimes(dateValue.toISOString().slice(0, 7), selectedCrimeCategory, selectedForce)
  }

  async function getCrimeCategories() {
    setShowLoadingDots(true)
    try {
      const eventRequestOptions = {
        url: `https://data.police.uk/api/crime-categoriess?date=2024-01`,
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
    setShowLoadingDots(false)
  }

  async function getForcesList() {
    setShowLoadingDots(true)
    try {
      const eventRequestOptions = {
        url: `https://data.police.uk/api/forcess`,
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
    setShowLoadingDots(false)
  }

  async function searchCrimes(dateString, crimeString, forceString) {
    setShowLoadingDots(true)
    setShowErrorDialog(false)
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
    setShowLoadingDots(false)
  }

  function parseSearchResults(searchResults) {
    let parsedSearchResults = searchResults.map(searchResult => ({
      investigationOutcome: searchResult?.outcome_status?.category,
      outcomeDate: searchResult?.outcome_status?.date,
      monthsToResolution: Math.abs(searchResult?.outcome_status?.date?.split('-')[1] - searchResult.month.split('-')[1])
    }))
    setSearchResults(parsedSearchResults)
  }

  return (
    <ThemeProvider theme={{ ...DEFAULT_THEME }}>
      <h1 style={{marginBottom: '40px', fontSize: '30px'}}>UK Police Data</h1>
      <Well>
        <Field.Label>Select a date</Field.Label>
        <DatePicker value={dateValue} onChange={setDateValue} maxValue={todaysDate} isCompact>
          <Input validation={isDateValid() ? undefined : 'error'} />
        </DatePicker>
        {!isDateValid() ? <Field.Message validation="error" style={{ marginTop: '8px' }}>
          Please Select a Date Before or Equal to Today</Field.Message> : null}
        <Button isPrimary isStretched style={{marginTop: '20px', marginBottom: '10px'}} disabled={!isDateValid()} onClick={getCrimeCategories}>
          Search Crime Categories
        </Button>
        {Object.keys(crimeCategories).length > 0 ? <Menu button="Please Select a Crime Category" onChange={onCategorySelect} style={{marginTop: '20px'}}>
          {Object.keys(crimeCategories).map(url => <Item value={url}>{crimeCategories[url]}</Item>)}
        </Menu> : null}
        {selectedCrimeCategory ? <Field>
          <Field.Label>Selected Category</Field.Label>
          <Input value={crimeCategories[selectedCrimeCategory]} disabled />
        </Field> : null}
      </Well>
      {Object.keys(forcesList).length > 0 ? <Well style={{marginTop: '20px'}}>
        <Menu button="Please Select a Force" onChange={onForceSelect} style={{marginTop: '20px', width: '100%'}}>
          {Object.keys(forcesList).map(id => <Item value={id}>{forcesList[id]}</Item>)}
        </Menu>
        {selectedForce ? <Field>
          <Field.Label>Selected Category</Field.Label>
          <Input value={forcesList[selectedForce]} disabled />
        </Field> : null}
      </Well> : null}
      {showSearchButton() ? <Button isPrimary isStretched style={{marginTop: '20px', marginBottom: '10px'}} onClick={searchCrimeButtonClick}>
        Search Again
      </Button> : null}
      <div id="anchor"></div>
      {searchResults?.length > 0 ? <div>
        <Alert type="success">
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
      {searchResults?.length === 0 ? <Alert type="warning">
      <Alert.Title>No Results</Alert.Title>
        No search results found for this criteria
      </Alert> : null}
      {showErrorDialog ? <Alert type="error">
      <Alert.Title>No Data</Alert.Title>
        No data available for this date
      </Alert> : null}
      {showApiErrorDialog ? <Alert type="error" style={{marginTop: '20px'}}>
      <Alert.Title>Site Error</Alert.Title>
        Error Accessing API, please try again later
      </Alert> : null}
      {showLoadingDots ? <Dots size={32} color={PALETTE.blue[700]} delayMS={0} style={{width: '100%', marginTop: '20px'}} /> : null}
    </ThemeProvider>
  )
}

export default TicketSideBar;
