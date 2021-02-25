
'use strict';

const URLS = [
  'https://s3.amazonaws.com/logtrust-static/test/test/data1.json', 
  'https://s3.amazonaws.com/logtrust-static/test/test/data2.json',
  'https://s3.amazonaws.com/logtrust-static/test/test/data3.json'
]
const REGEX = { 
  date: /[0-9]{4}-[0-9]{2}-[0-9]{2}/g, 
  utc: /[0-9]{8}[0]{5}/g,
  cat: /cat\s./gi,
  value: /[0-9]{1,3}\.[0-9]{10,15}/g
}
const INDEX = { date: 0, cat: 1, value: 2 }


window.onload = async () => {

  const { getAllData } = dataService()
  const allData = await getAllData(URLS)
  const processedData = processData(allData)
  drawCharts(processedData)

}


const processData = allData => {
    
  let dataArray =           parseUsingRegex(allData.flat())
  dataArray =               convertDataTypesByIndex(dataArray, INDEX.date)
  dataArray =               convertDataTypesByIndex(dataArray, INDEX.cat)
  dataArray =               convertDataTypesByIndex(dataArray, INDEX.value)
  dataArray =               sortAscendingByIndex(dataArray, INDEX.date)
  dataArray =               sortAscendingByIndex(dataArray, INDEX.cat)
  dataArray =               sumTogetherDoubleData(dataArray)
  return dataArray

}


const drawCharts = processedData => {

  const categories =        getUniqueValuesArray(processedData, INDEX.cat)
  const datesArray =        getUniqueValuesArray(processedData, INDEX.date)
  const dataByCat =         divideArrayByCategory(categories, processedData)
  const valuesObjectLine =  prepareForLineChart(datesArray, dataByCat)
  const valuesObjectPie =   prepareForPieChart(dataByCat)

  drawLineChart(datesArray, valuesObjectLine)
  drawPieChart(valuesObjectPie)

}


let parseUsingRegex = allData => {

  let parsedData = []
  allData.forEach(dataRow => {
    let newRow = []
    Object.values(dataRow).forEach(rowItem => { 
      rowItem = rowItem.toString()
      Object.values(REGEX).forEach(regexp => {
        if(rowItem.match(regexp)) {
           newRow.push((rowItem.match(regexp)).toString())
          }
      })
    })
    parsedData.push(newRow)
  })
  return parsedData

}


const convertDataTypesByIndex = (dataArray, index) => {

  dataArray.forEach(obj => {
    let newVal
    if(obj[index].match(REGEX.date)) { newVal = new Date(obj[index]).getTime() }
    if(obj[index].match(REGEX.cat)) { newVal = obj[index].toUpperCase() }
    if(obj[index].match(REGEX.value)) { newVal = parseFloat(obj[index]) }
    if(obj[index].match(REGEX.utc)) { newVal = parseInt(obj[index].match(REGEX.utc)) }
    obj.splice(index, 1, newVal)
  })
  return dataArray

}


const sortAscendingByIndex = (dataArray, index) => {

  let sortedData = dataArray.sort( (a,b) => {
    if(a[index] > b[index]) return 1
    if(a[index] < b[index]) return -1
    else return 0
  })
  return sortedData

}


const sumTogetherDoubleData = dataArray => {

  let lastCat = 0, lastTime = 0, lastValue = 0, newValue = 0
  let combinedValues = []
  dataArray.forEach(line => {
    if (line[INDEX.date] !== lastTime) { 
      combinedValues.push(line); 
    }
    if (line[INDEX.date] === lastTime) {
      combinedValues.pop()
      newValue = lastValue + line[INDEX.value]
      combinedValues.push([lastTime, lastCat, newValue])
    }
    lastValue = line[INDEX.value]
    lastCat = line[INDEX.cat]
    lastTime = line[INDEX.date]
  })
  return combinedValues

}


const getUniqueValuesArray = (processedData, index) => {

  let uniquesArr = []
  processedData.forEach(item => {
    if( !uniquesArr.includes(item[index]) ) { uniquesArr.push(item[index]) }
  })
  return uniquesArr

}


const divideArrayByCategory = (cats, processedData) => {

  let dividedArray = []
  cats.forEach(cat => {
    dividedArray.push(processedData.filter(item => item[INDEX.cat] === cat))
  })
  return dividedArray
  
}


const prepareForLineChart = (datesArray, dataByCat) => {

  let timeSeriesArr = [], finalObj = [], valueExists = false
  dataByCat.forEach(catItem => { 
    timeSeriesArr = []
    datesArray.forEach(dateItem => {   
      valueExists = false
      catItem.forEach(item => {
        if (item[INDEX.date] === dateItem){
          valueExists = true
          timeSeriesArr.push(item[INDEX.value])
        } 
      })
      if (valueExists === false) { timeSeriesArr.push(null) }
    })
    finalObj.push({ name: catItem[0][INDEX.cat], data: timeSeriesArr })
  })
  return finalObj

}


const prepareForPieChart = dataByCat => {

  let finalObj = []
  dataByCat.forEach(cat => {
    let sum = cat.reduce((passedIn, item) => passedIn + item[INDEX.value], 0)
    finalObj.push({ name: cat[0][INDEX.cat], y: sum })
  })
  return finalObj

}


const drawLineChart = (datesArray, valuesObjectLine) => {

  Highcharts.chart('lineChart', {
    chart: { type: 'line' },
    title: { text: 'Time Series' },
    xAxis: { 
      categories: datesArray,
      labels: {
        format: '{value:%e %b}',
        rotation: 45
      },
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle'
    },
    series: valuesObjectLine,
  })

}


const drawPieChart = valuesObjectPie => {

  Highcharts.chart('pieChart', {
    chart: { type: 'pie' },
    title: { text: 'Proportions' },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %'
        },
      }
    },
    series: [{
      name: 'Percentage',
      colorByPoint: true,
      data: valuesObjectPie
    }]
  })

}


const dataService = () => {

  const getAllData = async (urls) => {
    return await Promise.all(urls.map((url) => request('GET', url)).flat())
  }

  const request = (method, url) => {
    const promise = new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open(method, url)
      xhr.onload = () => { 
        if(xhr.status >= 400){ reject(xhr.response) } 
        else { resolve(JSON.parse(xhr.response)) }
      }
      xhr.onerror = () => { reject('Could not connect to API') }
      xhr.send()
    })
    return promise
  }

  return {
    getAllData
  }

}
