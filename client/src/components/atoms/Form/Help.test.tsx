import React from 'react'
import ReactDOM from 'react-dom'

import Help from './Help'

it('FormHelp renders without crashing', () => {
    const div = document.createElement('div')
    ReactDOM.render(
        <Help>Price of your data set asset in Nevermined Tokens.</Help>,
        div
    )
    ReactDOM.unmountComponentAtNode(div)
})
