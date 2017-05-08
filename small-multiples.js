function preprocess(d) {

    return {
        name: d['name changed'],
        starch: parseValue(d.starch),
        sugars: parseValue(d.sugars),
        fibres: parseValue(d['dietary fibres']),
        fat: parseValue(d["fat, total"]),
        protein: parseValue(d.protein),
        water: parseValue(d.water),
        energy: parseValue(d['energy kcal']),
        category: d.category
    };

    function parseValue(value) {
        if (value === '') {
            return 0;
        } else {
            return parseInt(value);
        }
    }
}


/*
 *
0 "Vegetables"
1 "Fruit"
2 "Diverse"
3 "Diary"
4 "Cereal"
5 "Meat"
6 "Sweets"
7 "Nuts"
8 "Fish"
9 "Bread"
10 "Snacks"

*/


var categoryColors = [
    '#b2df8a', // light green
    '#fb9a99', // rose
    '#cab2d6', // mauve
    '#a6cee3', // light blue
    '#fdbf6f', // yellow
    '#e31a1c', // red
    '#6a3d9a', // violet
    '#33a02c', // dark green 
    '#1f78b4', // dark blue
    '#ff7f00', // orange
];

d3.tsv('data/food-data.txt', preprocess, function (err, foods) {

    foods.sort((a, b) => a.energy - b.energy);
    let axesNames = d3.keys(foods[0]).filter(key =>
        key !== 'name' && key !== 'energy' && key !== 'gridCoords' && key !== 'categories' && key !== 'category');
    let mainCategories = getMainCategories(foods);
    
    let colorScale = d3.scaleOrdinal()
        .domain(mainCategories)
        .range(categoryColors);
    let energyDomain = [0, d3.max(foods.map(food => food.energy))];
    let binSize = 50;
    let [rows, columns] = addGridCoordinates(foods, energyDomain[0], binSize);
    let cellHeight = 60,
        cellWidth = 50,
        chartMargin = { top: 5, right: 5, bottom: 5, left: 5 },
        chartWidth = cellWidth - chartMargin.right - chartMargin.left,
        chartHeight = cellHeight - chartMargin.top - chartMargin.bottom,
        gridWidth = cellWidth * columns,
        gridHeight = cellHeight * rows,
        energyAxisWidth = 30,
        svgInnerMargin = 20,
        svgWidth = gridWidth + energyAxisWidth + svgInnerMargin * 2,
        svgHeight = gridHeight + svgInnerMargin * 2,
        dTheta = 2 * Math.PI / axesNames.length,
        axesAngles = axesNames.map((key, idx) => idx * dTheta),
        radialScaleMax = 100,
        R = d3.min([chartWidth, chartHeight]) / 2,
        r = 3,
        nrOfGuidingLines = 6;

    let svg = d3.select("body").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    let gridSelection = svg.append("g")
        .attr('class', 'grid')
        .attr('transform', 'translate(' + (energyAxisWidth + svgInnerMargin) + ',' + svgInnerMargin + ')');
    let axisSelection = svg.append("g")
        .attr('class', 'energy-axis')
        .attr('transform', 'translate(' + (svgInnerMargin) + ',' + svgInnerMargin + ')');

    addEnergyAxis();
    foods.forEach((food, idx) => addSpiderChart(food, gridSelection));

    function addEnergyAxis() {
        let scale = d3.scaleLinear()
            .domain(energyDomain)
            .range([0, gridHeight]);

        let tickValues = Array(rows).fill(0)
            .map((value, idx) => energyDomain[0] + idx * binSize);
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
            (food.gridCoords[1] - 1) * cellWidth + cellWidth / 2,
            (food.gridCoords[0] - 1) * cellHeight + cellHeight / 2];

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
            .attr('stroke', colorScale(food.category))
            .attr('fill', colorScale(food.category))
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
        spiderChart.append("text").text(food.name).attr("transform", "translate(-20,30)").attr("class", "food-name");
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

    function addGridCoordinates(foods, minEnergy, energyInterval) {
        let row = 1;
        let maxColumns = 1;
        let currentRow = [];
        for (let food of foods) {
            if (food.energy > row * energyInterval + minEnergy) {
                // Go to new row but first sort foods on current row according to categories.
                // Using the ordreing of the main categories list.
                assignColumInOrderOfCategories(currentRow, row);
                row++;
                if (currentRow.length > maxColumns) {
                    maxColumns = currentRow.length;
                }
                currentRow = [];
            }
            currentRow.push(food);
        }
        // once more for the last row.
        assignColumInOrderOfCategories(currentRow, row);
        return [row, maxColumns];

        function assignColumInOrderOfCategories(foodsOfRow, row) {
            let column = 1;
            for (let category of mainCategories) {
                for (let food of foodsOfRow) {
                    if (food.category === category) {
                        food.gridCoords = [row, column++];
                    }
                }
            }
        }
    }
    // function addGridCoordinates(foods, minEnergy, energyInterval) {
    //     var row = 1;
    //     var column = 1;
    //     var maxColumns = 1;
    //     for (let food of foods) {
    //         if (food.energy > row * energyInterval + minEnergy) {
    //             row++;
    //             if (column > maxColumns) {
    //                 maxColumns = column;
    //             }
    //             column = 1;
    //         }
    //         food.gridCoords = [row, column];
    //         column++;
    //     }
    //     return [row, maxColumns];
    // }
});

function getMainCategories(foods) {
    let categories = [];
    foods.forEach(function (food) {
        if (categories.indexOf(food.category) === -1) {
            categories.push(food.category);
        }
    });
    return categories;
}
