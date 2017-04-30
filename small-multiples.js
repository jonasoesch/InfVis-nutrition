function preprocess(d) {
    function parseValue(value) {
        if (value === '') {
            return 0;
        } else {
            return parseInt(value);
        }
    }

    return {
        name: d['name D'],
        starch: parseValue(d.starch),
        sugars: parseValue(d.sugars),
        fibres: parseValue(d['dietary fibres']),
        fat: parseValue(d["fat, total"]),
        protein: parseValue(d.protein),
        water: parseValue(d.water),
        energy: parseValue(d['energy kcal'])
    };
}

d3.tsv('data/selected-foods.txt', preprocess, function (err, foods) {

    var rows = 20;
    var energyRange = d3.extent(foods.map(food => food.energy));
    var energyInterval = (energyRange[1] - energyRange[0]) / rows;

    // Calculate the grid positions of the foods.
    foods.sort(function (a, b) {
        return a.energy - b.energy;
    });

    var columns = addGridCoordinates(foods, energyRange[0], energyInterval);
    var cellHeight = 50,
        cellWidth = 50,
        chartMargin = { top: 5, right: 5, bottom: 5, left: 5 },
        chartWidth = cellWidth - chartMargin.right - chartMargin.left,
        chartHeight = cellHeight - chartMargin.top - chartMargin.bottom,
        gridWidth = cellWidth * columns,
        gridHeight = cellHeight * rows ;

    let svg = d3.select("body").append("svg")
        .attr("width", gridWidth)
        .attr("height", gridHeight)
        .append("g")
        .attr('class', 'grid');

    var axesNames = d3.keys(foods[0]).filter(key => key !== 'name' && key !== 'energy' && key !== 'gridCoords'),
        dTheta = 2 * Math.PI / axesNames.length,
        axesAngles = axesNames.map((key, idx) => idx * dTheta),
        radialScaleMax = 100,
        R = d3.min([chartWidth, chartHeight]) / 2,
        // XXX determine inner radius empirically.
        r = 5,
        nrOfGuidingLines = 6;

    foods.forEach((food, idx) => addSpiderChartToGrid(food, idx));

    function addSpiderChartToGrid(food, idx) {

        var center = [
            (food.gridCoords[1] - 1) * cellHeight + cellHeight / 2,
            (food.gridCoords[0] - 1) * cellWidth + cellWidth / 2];

        let spiderChart = svg.append("g")
            .attr('class', "spider-chart")
            .attr("transform", "translate(" + center[0] + "," + center[1] + ")");

        // XXX The guiding lines can probably be created once and reused by all spider charts
        let guidingLines = createGuidingLines(axesAngles, nrOfGuidingLines, [r, R]);
        guidingLines.forEach(function (guidingLine, idx) {
            spiderChart.append('g')
                .append('path')
                .attr('class', 'guiding-line')
                .attr('d', guidingLine);
        });

        // XXX the radialScale also seems not to depend on the positions of the
        // spider charts.
        var radialScale = d3.scaleLinear()
            .domain([0, radialScaleMax])
            .range([r, R]);

        spiderChart.append('g')
            .append('polygon')
            .attr('class', 'food-polygon')
            // .attr('stroke', (food, idx) => d3.schemeCategory10[idx + 1])
            // .attr('fill', (food, idx) => d3.schemeCategory10[idx + 1])
            .attr('points', getPolygon(food, radialScale));

        var axes = createAxes(axesNames, radialScale);
        var adaptedAxesAngles = adaptAxesAnglesToSvg(axesAngles);
        axes.forEach(function (axis, idx) {
            var axisSelection = spiderChart.append('g')
                .attr('class', 'axis')
                .attr('transform', 'rotate(' + adaptedAxesAngles[idx] + ')')
                .call(axis);
        });
    }

    function getPolygon(food, radialScale) {
        return axesNames.map(function (axisName, idx) {
            var angle = axesAngles[idx] - Math.PI / 2;
            var radius = radialScale(food[axisName]);
            return [Math.cos(angle) * radius, Math.sin(angle) * radius];
        });
    }

    function getTextAnchor(axisAngle) {
        let eps = 1;
        if (180 - eps < axisAngle && axisAngle < 180 + eps ||
            0 - eps < axisAngle && axisAngle < 0 + eps) {
            return 'middle';
        }
        if (axisAngle < 180) {
            return 'end';
        } else {
            return 'start';
        }
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
            if (food.energy > row * energyInterval + minEnergy)  {
                row++;
                if (column > maxColumns) {
                    maxColumns = column;
                }
                column = 1;
            }
            food.gridCoords = [row, column];
            column++;
        }
        return maxColumns;
    }

});
