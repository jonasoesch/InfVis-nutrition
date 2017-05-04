function preprocess(d) {
    function parseValue(value) {
        if (value === '') {
            return 0;
        } else {
            return parseInt(value);
        }
    }

    return {
        name: d['name changed'],
        starch: parseValue(d.starch),
        sugars: parseValue(d.sugars),
        fibres: parseValue(d['dietary fibres']),
        fat: parseValue(d["fat, total"]),
        protein: parseValue(d.protein),
        water: parseValue(d.water),
        energy: parseValue(d['energy kcal'])
    };
}

d3.tsv('data/food-data.txt', preprocess, function (err, foods) {

    // With bin size given.
    var binSize = 50;
    var energyDomain = [0, d3.max(foods.map(food => food.energy))];
    var energyInterval = binSize;
    // With number of rows given
    // var rows = 15;
    // var energyDomain = d3.extent(foods.map(food => food.energy));
    // var energyInterval = (energyDomain[1] - energyDomain[0]) / rows;

    foods.sort(function (a, b) {
        return a.energy - b.energy;
    });

    var [rows, columns] = addGridCoordinates(foods, energyDomain[0], energyInterval);
    var cellHeight = 50,
        cellWidth = 50,
        chartMargin = { top: 5, right: 5, bottom: 5, left: 5 },
        chartWidth = cellWidth - chartMargin.right - chartMargin.left,
        chartHeight = cellHeight - chartMargin.top - chartMargin.bottom,
        gridWidth = cellWidth * columns,
        gridHeight = cellHeight * rows,
        energyAxisWidth = 30,
        svgInnerMargin = 20,
        svgWidth = gridWidth + energyAxisWidth + svgInnerMargin * 2,
        svgHeight = gridHeight + svgInnerMargin * 2;

    let svg = d3.select("body").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    let gridSelection = svg.append("g")
        .attr('class', 'grid')
        .attr('transform', 'translate(' + (energyAxisWidth + svgInnerMargin) + ',' + svgInnerMargin + ')');
    let axisSelection = svg.append("g")
        .attr('class', 'energy-axis')
        .attr('transform', 'translate(' + (svgInnerMargin) + ',' + svgInnerMargin + ')');

    let axesNames = d3.keys(foods[0]).filter(key => key !== 'name' && key !== 'energy' && key !== 'gridCoords'),
        dTheta = 2 * Math.PI / axesNames.length,
        axesAngles = axesNames.map((key, idx) => idx * dTheta),
        radialScaleMax = 100,
        R = d3.min([chartWidth, chartHeight]) / 2,
        r = 3,
        nrOfGuidingLines = 6;

    addEnergyAxis();
    foods.forEach((food, idx) => addSpiderChart(food, gridSelection));

    function addEnergyAxis() {
        let scale = d3.scaleLinear()
            .domain(energyDomain)
            .range([0, gridHeight]);

        let tickValues = Array(rows).fill(0)
            .map((value, idx) => energyDomain[0] + idx * energyInterval);
        tickValues.push(energyDomain[1]);
        let axis = d3.axisRight(scale)
            .tickValues(tickValues);

        axisSelection.call(axis);

        axisSelection.append('text')
            .attr('class', 'axis-text')
            .attr('transform', 'translate(-10, ' + gridHeight / 2 + ') rotate(-90)')
            .attr('text-anchor', 'middle')
            .text('Energy (kcal)');
    }

    function addSpiderChart(food, svgSelection) {

        let center = [
            (food.gridCoords[1] - 1) * cellHeight + cellHeight / 2,
            (food.gridCoords[0] - 1) * cellWidth + cellWidth / 2];

        let spiderChart = svgSelection.append("g")
            .attr('class', "spider-chart")
            .attr("transform", "translate(" + center[0] + "," + center[1] + ")");

        // let guidingLines = createGuidingLines(axesAngles, nrOfGuidingLines, [r, R]);
        // guidingLines.forEach(function (guidingLine, idx) {
        //     spiderChart.append('g')
        //         .append('path')
        //         .attr('class', 'guiding-line')
        //         .attr('d', guidingLine);
        // });

        let radialScale = d3.scaleLinear()
            .domain([0, radialScaleMax])
            .range([r, R]);

        let axes = createAxes(axesNames, radialScale);
        let adaptedAxesAngles = adaptAxesAnglesToSvg(axesAngles);
        axes.forEach(function (axis, idx) {
            var axisSelection = spiderChart.append('g')
                .attr('class', 'axis')
                .attr('transform', 'rotate(' + adaptedAxesAngles[idx] + ')')
                .call(axis);

        });

        let polygonPoints = getPolygonPoints(food, axesNames, axesAngles, radialScale);
        spiderChart.append('g')
            .append('polygon')
            .attr('class', 'food-polygon')
            // .attr('stroke', (food, idx) => d3.schemeCategory10[idx + 1])
            // .attr('fill', (food, idx) => d3.schemeCategory10[idx + 1])
            .attr('points', polygonPoints);


        spiderChart.append('g')
            .append('polygon')
            .attr('class', 'center-polygon')
            .attr('points', getCenterPolygon(axesAngles, r));

        // polygonPoints.forEach(function (point) {
        //     spiderChart.append('circle')
        //         .attr('class', 'food-points')
        //         .attr('cx', point[0])
        //         .attr('cy', point[1]);
        // });

        // Label for the name of each food
        spiderChart.append("text").text(food.name).attr("transform", "translate(-20,25)").attr("class", "food-name");
    }


    function getPolygonPoints(food, axesNames, axesAngles, radialScale) {
        return axesNames.map(function (axisName, idx) {
            var angle = axesAngles[idx] - Math.PI / 2;
            var radius = radialScale(food[axisName]);
            return [Math.cos(angle) * radius, Math.sin(angle) * radius];
        });
    }

    function getCenterPolygon(axesAngles, radius) {
        return axesAngles.map(function (axisAngle) {
            var angle = axisAngle - Math.PI / 2;
            return [Math.cos(angle) * radius, Math.sin(angle) * radius];
        });
    }

    function adaptAxesAnglesToSvg(axesAngles) {
        return axesAngles.map(function (axisAngle) {
            return svgHasADifferentZeroAngle(axisAngle * 180 / Math.PI);
        });
    }

    function svgHasADifferentZeroAngle(angle) {
        if (angle >= 180) {
            return angle - 180;
        } else {
            return angle + 180;
        }
    }

    function createGuidingLines(axesAngles, nrOfGuidingLines, minMaxRadius) {
        function zip(radius) {
            return axesAngles.map(axisAngle => [axisAngle, radius]);
        }
        var radialIncrement = (minMaxRadius[1] - minMaxRadius[0]) / (nrOfGuidingLines - 1);
        var zipped = [];
        for (var i = 0; i < nrOfGuidingLines; i++) {
            let radius = minMaxRadius[0] + i * radialIncrement;
            zipped[i] = zip(radius);
            // Add the first element to the back of the line in order to close it.
            zipped[i].push(zipped[i][0]);
        }
        var radialLine = d3.radialLine()
            .angle(function (d) { return d[0]; })
            .radius(function (d) { return d[1]; });
        return zipped.map(line => radialLine(line));
    }

    function createAxes(axesNames, radialScale) {
        return axesNames.map(function (axis, idx) {
            return d3.axisLeft(radialScale)
                .ticks(0)
                .tickSize(0);
        });
    }

    // Grid coordinates are [row, column]
    function addGridCoordinates(foods, minEnergy, energyInterval) {
        var row = 1;
        var column = 1;
        var maxColumns = 1;
        for (let food of foods) {
            if (food.energy > row * energyInterval + minEnergy) {
                row++;
                if (column > maxColumns) {
                    maxColumns = column;
                }
                column = 1;
            }
            food.gridCoords = [row, column];
            column++;
        }
        return [row, maxColumns];
    }

});
