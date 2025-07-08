import { useEffect, useState } from 'react'
import { useClient } from '../hooks/useClient'

import { Button } from '@zendeskgarden/react-buttons';
import { DatePicker } from '@zendeskgarden/react-datepickers';
import { Field, Input } from '@zendeskgarden/react-forms';
import { Menu, Item } from '@zendeskgarden/react-dropdowns';

import { PALETTE } from '@zendeskgarden/react-theming';
import { Dots } from '@zendeskgarden/react-loaders';
import { ThemeProvider, DEFAULT_THEME } from '@zendeskgarden/react-theming'

/*

https://data.police.uk/docs/method/crime-categories/
https://data.police.uk/docs/method/forces/
https://data.police.uk/docs/method/crimes-no-location/


https://data.police.uk/api/crimes-no-location?category=all-crime&date=2022-05&force=leicestershire
*/

const TicketSideBar = () => {
  const client = useClient()
  const todaysDate = new Date()

  const [dateValue, setDateValue] = useState(new Date())
  const [crimeCategories, setCrimeCategories] = useState([])

  useEffect(() => {
    (async () => {
      client.invoke('resize', { width: '100%', height: '550px' })
    })()
  }, [])

  const isDateValid = () => {
    return dateValue <= todaysDate
  }

  async function getCrimeCategories() {
    const eventRequestOptions = {
      url: `https://data.police.uk/api/crime-categories?date=2024-01`,
    }
    const response = await client.request(eventRequestOptions)
    console.log(response)
    setCrimeCategories(response)
  }

  const onCategorySelect = (category) => {
    if (category.value) {
      console.log(category.value)
    }
  }

  return (
    <ThemeProvider theme={{ ...DEFAULT_THEME }}>
      <h1 style={{marginBottom: '40px', fontSize: '30px'}}>UK Police Data</h1>
      <Field.Label>Select a date</Field.Label>
      <DatePicker value={dateValue} onChange={setDateValue} maxValue={todaysDate} isCompact>
        <Input validation={isDateValid() ? undefined : 'error'} />
      </DatePicker>
      {!isDateValid() ? <Field.Message validation="error" style={{ marginTop: '8px' }}>
        Please Select a Date Before or Equal to Today</Field.Message> : null}
      <Button isPrimary isStretched style={{marginTop: '20px'}} disabled={!isDateValid()} onClick={getCrimeCategories}>
        Search Crime Categories
      </Button>
      {/* <Dots size={32} color={PALETTE.blue[700]} /> */}
      {crimeCategories.length > 0 ? <Menu button="Choose Category" onChange={onCategorySelect}>
        {/* <Item value="cactus">Cactus</Item>
        <Item value="jade">Jade plant</Item>
        <Item value="echeveria">Echeveria</Item> */}
        {/* {crimeCategories.forEach(category => console.log(category))} */}
        {crimeCategories.map(category => <Item value={category.url}>{category.name}</Item>)}
      </Menu> : null}
    </ThemeProvider>
  )
}

export default TicketSideBar;
