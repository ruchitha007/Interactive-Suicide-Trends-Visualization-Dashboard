var margins = {top: 30, right: 50, bottom: 50, left: 70};
var width = 960 - margins.left - margins.right;
var height = 500 - margins.top - margins.bottom;

// Set up the SVG canvas
var svg = d3.select("#line-chart").append("svg")
    .attr("viewBox", `0 0 ${width + margins.left + margins.right} ${height + margins.top + margins.bottom}`)
    .append("g")
    .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

// Set up the SVG canvas for the bar chart
var svgBarChart = d3.select("#bar-chart").append("svg")
    .attr("viewBox", `0 0 ${width + margins.left + margins.right} ${height + margins.top + margins.bottom}`)
    .append("g")
    .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

// Define margins and dimensions for the row chart
var rowChartMargins = { top: 30, right: 10, bottom: 30, left: 50 };
var rowChartWidth = 300 - rowChartMargins.left - rowChartMargins.right;
var rowChartHeight = 400 - rowChartMargins.top - rowChartMargins.bottom;

// Create an SVG element for the row chart
var svgRowChart = d3.select("#row-chart").append("svg")
    .attr("width", rowChartWidth + rowChartMargins.left + rowChartMargins.right)
    .attr("height", rowChartHeight + rowChartMargins.top + rowChartMargins.bottom)
    .append("g")
    .attr("transform", "translate(" + rowChartMargins.left + "," + rowChartMargins.top + ")");

// Set up the SVG canvas for the map
var svg_map = d3.select("#map-chart").append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g");

// Define a tooltip for pie chart 
var tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('display', 'none')
    .style('position', 'absolute')
    .style('background', '#fff')
    .style('padding', '5px')
    .style('border', '1px solid #000')
    .style('border-radius', '5px')
    .style('pointer-events', 'none');

//Add a tooltip for bar chart
var tooltipBar = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('display', 'none')
    .style('position', 'absolute')
    .style('background', '#fff')
    .style('padding', '5px')
    .style('border', '1px solid #000')
    .style('border-radius', '5px')
    .style('pointer-events', 'none');

//Add a tooltip for the line graph
var tooltipLine = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('display', 'none')
    .style('position', 'absolute')
    .style('background', '#fff')
    .style('padding', '5px')
    .style('border', '1px solid #000')
    .style('border-radius', '5px')
    .style('pointer-events', 'none');

Promise.all([
    d3.csv("data/Suicide FinalNew3.csv"), 
    d3.json("data/us_states_data.json")
    ]).then(function(data){
        
        suicideData = data[0];
        statesData = data[1];
        
        let aggregatedData = {};
        suicideData.forEach(function(d) {
            const year = d.year;
            const race = d.race;
            const deaths = parseInt(d.deaths, 10) || 0; // Handle non-numeric values

            if (!aggregatedData[year]) {
                aggregatedData[year] = {};
            }
            if (!aggregatedData[year][race]) {
                aggregatedData[year][race] = 0;
            }
            aggregatedData[year][race] += deaths;
        });

        let dataByRace = {};

        for (let year in aggregatedData) {
            if (aggregatedData.hasOwnProperty(year)) {
                for (let race in aggregatedData[year]) {
                    if (!dataByRace[race]) {
                        dataByRace[race] = [];
                    }
                    dataByRace[race].push({
                        year: parseInt(year, 10),
                        deaths: aggregatedData[year][race]
                    });
                }
            }
        }
        
        // Create the line graph
        createLineGraph(dataByRace);

        //Call year selector
        showYearSelector(suicideData, statesData);
    });

//Function to display total number of deaths
function showNumberofDeaths(data) {
    
    // Remove the existing SVG if it exists
    d3.select('#suicides-figure').select('svg').remove();

    var svgNumber = d3.select('#suicides-figure').append('svg')
        .attr("width", 200)
        .attr("height", 100);

    // Calculate the x position based on the length of the formatted number
    var xPos = 100; // Adjust this based on your specific layout needs

    svgNumber.append("text")
        .attr("x", xPos)
        .attr("y", 50)
        .attr("text-anchor", "middle")
        .attr("font-size", "15px")
        .attr("font-weight", "bold")
        .text("Total Deaths: " + data);
}


// Modify the createRowChart function to scale x-axis within 0-10 and sort in descending order
function createRowChart(stateAggregatedData) {
    
    //Clear the svg
    svgRowChart.selectAll("*").remove();

    // Convert stateAggregatedData into an array of objects
    var dataAsArray = Object.keys(stateAggregatedData).map(key => {
        return {
            state: key,
            deaths: stateAggregatedData[key]
        };
    });

    // Sort the states based on the total deaths in descending order
    var sortedData = dataAsArray.sort((a, b) => b.deaths - a.deaths);

    // Get the top 10 states
    var topStatesData = sortedData.slice(0, 10);

    // Create a band scale for the y-axis
    var y = d3.scaleBand()
        .domain(topStatesData.map(d => d.state))
        .range([0, rowChartHeight])
        .padding(0.1);

    // Create a linear scale for the x-axis within 0-10
    var x = d3.scaleLinear()
        .domain([0, 10]) // Set the domain to 0-10
        .range([0, rowChartWidth]);

    // Draw rectangles for each state
    svgRowChart.selectAll(".bar")
        .data(topStatesData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("width", d => x((parseInt(d.deaths, 10) / d3.max(topStatesData, d => parseInt(d.deaths, 10))) * 10)) // Scale within 0-10
        .attr("height", y.bandwidth())
        .attr("y", d => y(d.state))
        .attr("fill", "#DC143C")
        .on('mouseover', function (event, d) {
            tooltip
                .style('opacity', 1)
                .style('display', 'inline')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px')
                .html(`State: ${d.state}<br>Deaths: ${d.deaths}`);
        })
        .on('mouseout', function () {
            tooltip.style('display', 'none');
        });

    // Add X axis with ticks at 0, 2, 4, 6, 8, and 10
    svgRowChart.append("g")
        .attr("transform", "translate(0," + rowChartHeight + ")")
        .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format(".0f")));

    // Add Y axis with top states in descending order
    svgRowChart.append("g")
        .call(d3.axisLeft(y));

    // Add X axis label
    svgRowChart.append("text")
        .attr("transform", `translate(${rowChartWidth / 2}, ${rowChartHeight + rowChartMargins.bottom -3})`)
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "bold")
        .text("Number of Deaths (Scaled 0-10)");

    // Add Y axis label
    svgRowChart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - rowChartMargins.left - 4)
        .attr("x", 0 - (rowChartHeight / 1.8))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "bold")
        .text("State");
}

function aggregateDeathsByAge(data) {
    let result = {};

    data.forEach(function (d) {
        const agegroup = d.agegroups;
        const deaths = parseInt(d.deaths, 10) || 0; // Handle non-numeric values

        if (!result[agegroup]) {
            result[agegroup] = 0;
        }
        result[agegroup] += deaths;
    });

    // Convert aggregated data to an array of objects
    var ageDeathsData = Object.keys(result).map(function (agegroup) {
        return {
            agegroup: agegroup,
            deaths: result[agegroup]
        };
    });

    return ageDeathsData;
}

//Function to aggregate data by age for each year separately
function dynamicAggregateDataByAge(dataArray, selectedYear) {
    let aggregatedData = {};

    // Aggregate data by year and agegroup
    dataArray.forEach(dataItem => {
        const agegroup = dataItem.agegroups;
        const deaths = parseInt(dataItem.deaths, 10) || 0;
        const yearOfDataItem = dataItem.year;

        if (!isNaN(deaths) && yearOfDataItem === selectedYear) {
            if (!aggregatedData[agegroup]) {
                aggregatedData[agegroup] = 0; // Initialize with 0
            }
            aggregatedData[agegroup] += deaths; // Aggregate deaths
        }
    });

    // Convert aggregated data into an array of objects
    let dataArrayForSelectedYear = Object.keys(aggregatedData).map(agegroup => {
        return {
            agegroup: agegroup,
            deaths: aggregatedData[agegroup]
        };
    });

    return dataArrayForSelectedYear;
}

// Function to create bar chart by age
function createBarChartByAge(svg, data) {
    //Clear the svg
    svg.selectAll("*").remove();

    // Create a band scale for the age groups
    var x = d3.scaleBand()
        .domain(data.map(function(d) { return d.agegroup; }))
        .range([0, width])
        .padding(0.1);

    // Create a linear scale for the y-axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d.deaths; })])
        .range([height, 0]);

    // Draw bars for each age group
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.agegroup); })
        .attr("y", function(d) { return y(d.deaths); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.deaths); })
        .style("fill", "#DC143C")
        .on('mouseover', function (event, d) {
            tooltipBar
                .style('opacity', 1)
                .style('display', 'inline')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px')
                .html(`Age Group: ${d.agegroup}<br>Deaths: ${d.deaths}`);
        })
        .on('mouseout', function () {
            tooltipBar.style('display', 'none');
        });

    // Add X axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("font-size", "15px");

    // Add Y axis
    svg.append("g")
    .call(d3.axisLeft(y).ticks(null, "r").tickFormat(function(d) {
        return d3.format(".0s")(d).replace(/G/, "B").replace(/M/, "M").replace(/k/, "k");
    }))
    .selectAll("text")
    .attr("font-size", "15px");


    // Add X axis label
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margins.bottom - 10})`)
        .style("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Age Group");

        //yAxis.tickFormat(d3.format(".0s"));
    // Add Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margins.left - 4)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Deaths");

}
//Aggregate Data by race, year and state
function aggregateDeathsByYearRaceAndState(data) {
    let result = {};

    data.forEach(function(d) {
        const year = d.year;
        const race = d.race;
        const state = d.state;
        const deaths = parseInt(d.deaths, 10) || 0;
        const population = parseInt(d.population, 10) || 0;

        if (!result[year]) {
            result[year] = {};
        }
        if (!result[year][state]) {
            result[year][state] = {};
        }
        if (!result[year][state][race]) {
            result[year][state][race] = { totalDeaths: 0, totalPopulation: 0 };
        }

        result[year][state][race].totalDeaths += deaths;
        result[year][state][race].totalPopulation += population;
    });

    // Normalize the death values by population
    for (let year in result) {
        for (let state in result[year]) {
            for (let race in result[year][state]) {
                let raceData = result[year][state][race];
                raceData.normalizedDeathRate = (raceData.totalPopulation > 0) 
                    ? (raceData.totalDeaths / raceData.totalPopulation) * 100000
                    : 0;
            }
        }
    }

    return result;
}


// Function to aggregate deaths by year, race and state for each year separately
function dynamicAggregateDataByYearRaceAndState(dataArray, selectedYear) {
    let aggregatedData = {};

    dataArray.forEach(dataItem => {
        const state = dataItem.state;
        const deaths = parseInt(dataItem.deaths, 10) || 0;
        const yearOfDataItem = dataItem.year;
        const race = dataItem.race;
        const population = parseInt(dataItem.population, 10) || 0;

        if(!isNaN(deaths) && yearOfDataItem === selectedYear) {
            if(!aggregatedData[yearOfDataItem]) {
                aggregatedData[yearOfDataItem] = {};
            }
            if(!aggregatedData[yearOfDataItem][state]) {
                aggregatedData[yearOfDataItem][state] = {};
            }
            if(!aggregatedData[yearOfDataItem][state][race]) {
                aggregatedData[yearOfDataItem][state][race] = {totalDeaths: 0, totalPopulation: 0};
            }

            aggregatedData[yearOfDataItem][state][race].totalDeaths += deaths;
            aggregatedData[yearOfDataItem][state][race].totalPopulation += population;

            let aggregatedDataForYear = aggregatedData[selectedYear];
            for(let state in aggregatedDataForYear) {
                for(let race in aggregatedDataForYear[state]) {
                    let raceData = aggregatedDataForYear[state][race];
                    raceData.normalizedDeathRate = (raceData.totalPopulation > 0) 
                        ? (raceData.totalDeaths / raceData.totalPopulation) * 100000
                        : 0;
                }
            }
        }
    });

     // Return the data for the selected year
    return aggregatedData[selectedYear] || {}; 

}

//Add a function to aggregate data for each year separately
function dynamicAggregateDataByYear(dataArray, selectedYear) {
    const aggregatedData = {};

    dataArray.forEach(dataItem => {
        const state = dataItem.state; 
        const deaths = parseInt(dataItem.deaths, 10); 
        const yearOfDataItem = dataItem.year; 

        // Ensure deaths is a valid number before aggregating
        if (!isNaN(deaths) && yearOfDataItem == selectedYear) {
            if (aggregatedData[state]) {
                aggregatedData[state] += deaths;
            } else {
                aggregatedData[state] = deaths;
            }
        }
    });

    return aggregatedData;
}

//Function to aggregate data for each state
function aggregateDataByState(dataArray) {
    const stateAggregatedData = {};

    dataArray.forEach(dataItem => {
        const state = dataItem.state; 
        const deaths = parseInt(dataItem.deaths, 10); 

        // Ensure deaths is a valid number before aggregating
        if (!isNaN(deaths)) {
            if (stateAggregatedData[state]) {
                stateAggregatedData[state] += deaths;
            } else {
                stateAggregatedData[state] = deaths;
            }
        }
    });

    return stateAggregatedData; 
}
// Function to calculate moving averages

// Function to create the pie chart
function createPieChart(data) {
    var pieChartWidth = 300;
    var pieChartHeight = 500;
    var radius = Math.min(pieChartWidth, pieChartHeight / 2) / 2;

    var legendRectSize = 18; // Size of legend color boxes
    var legendSpacing = 4; // Spacing between legend items
    


    var aggregatedData = d3.rollup(
        data,
        (v) => d3.sum(v, (d) => d.normalizedDeathRate),
        (d) => d.race
    );

    // Convert aggregated data to an array of objects
    var pieData = Array.from(aggregatedData, ([race, normalizedDeathRate]) => ({ race, normalizedDeathRate }));

    // Sort the pie data based on the total deaths for each race (in descending order)
    pieData.sort((a, b) => b.normalizedDeathRate - a.normalizedDeathRate);

    // Define the color scale
    var color = d3.scaleOrdinal()
    .domain(pieData.map((d) => d.race))
    .range(d3.schemeCategory10);

    // Create a pie chart layout
    var pie = d3.pie()
        .sort(null) // Keep the sorting order based on the sorted pieData
        .value(function (d) { return d.normalizedDeathRate; });


    // Define an arc generator
    var arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);
    

    // Create an SVG element for the pie chart
    var svgPie = d3.select("#pie-chart").select("svg");
    if (svgPie.empty()) {
        svgPie = d3.select("#pie-chart").append("svg")
            .attr("width", pieChartWidth)
            .attr("height", pieChartHeight)
    }

    
    svgPie.selectAll("*").remove(); // Clear the SVG element if it's already populated
    //Append a group element to the SVG element
    svgPie = svgPie.append("g")
        .attr("transform", "translate(" + pieChartWidth / 2 + "," + pieChartHeight / 3 + ")");

    // Draw the pie chart slices
    var g = svgPie.selectAll(".arc")
        .data(pie(pieData))
        .enter().append("g")
        .attr("class", "arc");

    // Draw the slices
    g.append("path")
        .attr("d", arc)
        .style("fill", function (d) { return color(d.data.race); })
        .style("stroke", "white")
        .on('mouseover', function(event, d) {
            tooltip
                .style('opacity', 1)
                .style('display', 'inline')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px')
                .html(`Race: ${d.data.race}<br>Normalized Death Rate: ${d.data.normalizedDeathRate.toFixed(2)}`);
        })
        .on('mouseout', function() {
            tooltip.style('display', 'none');
        });

    var legend = svgPie.selectAll(".legend")
    .data(pieData)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) {
        // Increment the y position based on the index. Each legend item is legendRectSize + legendSpacing apart.
        return `translate(-90,${i * (legendRectSize + legendSpacing) + 150})`;
    });

    legend.append("rect")
        .attr("width", legendRectSize)
        .attr("height", legendRectSize)
        .attr("x", 0) // x position can be 0 since they are aligned vertically
        .attr("y", function(d, i) { return i * (legendRectSize + legendSpacing); })
        .attr("fill", function(d) { return color(d.race); });

    legend.append("text")
        .attr("x", legendRectSize + 5)
        .attr("y", function(d, i) { return i * (legendRectSize + legendSpacing); })
        .attr("dy", "0.8em") // to align the text in the center of the rect
        .text(function(d) { return d.race; })
        .style("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

}

// Function to create the line graph
function createLineGraph(data) {

    // Define the color scale
    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // Process the data: ensure that year and deaths are numeric
    Object.keys(data).forEach(key => {
        data[key].forEach(d => {
            d.year = +d.year;
            d.deaths = +d.deaths;
        });
    });

     // Find the smallest non-zero deaths value for the log scale domain
    const minDeaths = d3.min(Object.values(data).flat(), d => (d.deaths > 0 ? d.deaths : Infinity));

     // Define the domain for the x and y scales
    var x = d3.scaleLinear()
        .domain([d3.min(Object.values(data).flat(), d => d.year), d3.max(Object.values(data).flat(), d => d.year)])
        .range([0, width]);

    var y = d3.scaleLog()
        .domain([minDeaths, d3.max(Object.values(data).flat(), d => d.deaths)])
        .range([height, 0])
        .nice(); 

    // Add X axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .selectAll("text")
        .attr("font-size", "15px");

    // Add Y axis
    svg.append("g")
    .call(d3.axisLeft(y).ticks(null, "r").tickFormat(function(d){
        return y.tickFormat(4,d3.format(",d"))(d)
    }))
    .selectAll("text")
    .attr("font-size", "15px");

    // Add X axis label
    svg.append("text")
        .attr("transform", `translate(${width/2}, ${height + margins.bottom - 10})`)
        .style("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Year");

    // Add Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margins.left - 4)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Deaths Per Capita (per 100,000)");

    // Define the line generator
    var line = d3.line()
    .x(function(d) { return x(d.year); })
    .y(function(d) { return y(d.deaths); });

    // Draw lines for each group
    Object.keys(data).forEach(function(key) {
        var bisectDate = d3.bisector(function(d) { return d.year; }).left;
    
        svg.append("path")
            .datum(data[key])
            .attr("class", "line")
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", color(key))
            .attr("stroke-width", 3)
            .on('mouseover', function(event, d) {
                var x0 = x.invert(d3.pointer(event, this)[0]),
                    i = bisectDate(d, x0, 1),
                    d0 = d[i - 1],
                    d1 = d[i],
                    e = x0 - d0.year > d1.year - x0 ? d1 : d0;
                tooltipLine
                    .style('opacity', 1)
                    .style('display', 'inline')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px')
                    .html(`Race: ${key}<br>Deaths: ${e.deaths}`);
            })
            .on('mouseout', function() {
                tooltipLine.style('display', 'none');
            });
    });
    


    // Legend (assuming the rest of your legend code is correct)
    var legend = svg.selectAll(".legend")
        .data(Object.keys(data))
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(10," + i * 30 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 22)
        .attr("height", 22)
        .style("fill", function(d, i) { return color(d); });

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .attr("font-size", "20px")
        .text(function(d) { return d; });
}


// Function to create the  chloropleth map
function createMap(stateData, statesGeoJSON) {
    // Define a projection and path generator
    
    var projection = d3.geoAlbersUsa()
        .scale(800)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    
    svg_map.selectAll(".state").remove();

    // Define a color scale
    var colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain(d3.extent(Object.values(stateData)));

    // Draw the states
    svg_map.selectAll(".state")
        .data(statesGeoJSON.features)
        .enter().append("path")
        .attr("class", "state")
        .attr("d", path)
        .style("fill", function(d) {
            // Use a property from each feature to get the corresponding data value
            var value = stateData[d.properties.NAME]; 
            return value ? colorScale(value) : "#ccc";
        })
        .on("mouseover", function(event, d) {
            var value = stateData[d.properties.NAME]; 
            // Update the content of the info-box using jQuery
            $('#info-box').text("Deaths in " + d.properties.NAME + ": " + value)
            .addClass('has-content')
            .show(); // Show the info box
        })
        .on("mouseout", function() {
            // Hide the info box when not hovering
            $('#info-box').hide();
        });
}

//Function to flatten the data with or without year index
function flattenData(data){
    let flattenedData = [];

    keys = Object.keys(data);

    if (keys[0] === '2005') {
        for(let year in data){
            for(let state in data[year]){
                for (let race in data[year][state]) {
                    flattenedData.push({
                        race: race,
                        normalizedDeathRate: data[year][state][race].normalizedDeathRate
                    });
                }
            }
        }
    }

    else {
        for(let state in data){
            for (let race in data[state]) {
                flattenedData.push({
                    race: race,
                    normalizedDeathRate: data[state][race].normalizedDeathRate
                });
            }
        }
    }

    return flattenedData;

}

//Function to get total number of deaths
function aggregateTotalDeaths(data) {
    let totalDeaths = 0;
    data.forEach(row => {
        // Convert to number if it's not already a number
        let deaths = Number(row.deaths);
        // Check if the conversion gives a valid number
        if (!isNaN(deaths)) {
            totalDeaths += deaths;
        } 
    });
    return totalDeaths;
}




//Function to get total number of deaths for each year
function getTotalDeathsForYear(data, inputYear) {
    let totalDeaths = 0;
    data.forEach(row => {
        // Convert to number if it's not already a number
        let deaths = Number(row.deaths);
        let year = row.year;
        // Check if the conversion gives a valid number
        if (!isNaN(deaths) && year === inputYear) {
            totalDeaths += deaths;
        } 
    });
    return totalDeaths;
}


// Function to create the year selector and update the visualizations when the year changes
function showYearSelector(data, statesGeoJSON) {
    var yearSelector = d3.select("#year-selector")
        .append("select")
        .attr("class", "form-control");

    var years = Array.from(new Set(data.map(d => d.year))).sort();

    years.unshift("All"); // Add an option to select all years

    yearSelector.selectAll("option")
        .data(years)
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d);
    
    yearSelector.on("change", function() {
        var selectedYear = this.value;

        if (selectedYear === "All") {
            var yearData = aggregateDataByState(data);
            var newAggregatedData = aggregateDeathsByYearRaceAndState(data);
            var newflattenedData = flattenData(newAggregatedData);
            var newAggregatedDataByAge = aggregateDeathsByAge(data);
            newAggregatedDataByAge.sort(function(a, b) {
                if(a.agegroup === "5-14") return -1;
                if(b.agegroup === "5-14") return 1;
                return d3.ascending(a.agegroup, b.agegroup);
            });
            var totalDeaths = aggregateTotalDeaths(data);
        } else {
            var yearData = dynamicAggregateDataByYear(data, selectedYear);
            var newAggregatedData = dynamicAggregateDataByYearRaceAndState(data, selectedYear);
            var newflattenedData = flattenData(newAggregatedData);
            var newAggregatedDataByAge = dynamicAggregateDataByAge(data, selectedYear);
            newAggregatedDataByAge.sort(function(a, b) {
                if(a.agegroup === "5-14") return -1;
                if(b.agegroup === "5-14") return 1;
                return d3.ascending(a.agegroup, b.agegroup);
            });
            var totalDeaths = getTotalDeathsForYear(data, selectedYear);
        }
        
        createPieChart(newflattenedData);
        createMap(yearData, statesGeoJSON); 
        createBarChartByAge(svgBarChart, newAggregatedDataByAge);
        createRowChart(yearData);
        showNumberofDeaths(totalDeaths);
    });

    // Initial map load
    var initialData = aggregateDataByState(data);
    createMap(initialData, statesGeoJSON);

    // Initial pie chart load
    var initialAggregatedData = aggregateDeathsByYearRaceAndState(data);
    var initialflattenedData = flattenData(initialAggregatedData);
    createPieChart(initialflattenedData);

    // Initial bar chart load
    var initialAggregatedDataByAge = aggregateDeathsByAge(data);
    initialAggregatedDataByAge.sort(function(a, b) {
        if(a.agegroup === "5-14") return -1;
        if(b.agegroup === "5-14") return 1;
        return d3.ascending(a.agegroup, b.agegroup);
    });
    createBarChartByAge(svgBarChart, initialAggregatedDataByAge);

    // Initial row chart load
    createRowChart(initialData);

    // Initial number of deaths load
    var totalDeaths = aggregateTotalDeaths(data);
    console.log(totalDeaths);
    showNumberofDeaths(totalDeaths);
}




