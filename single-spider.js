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
        category: d['category'],
        // carbohydrates: parseValue(d["carbohydrates, available"])
    };
}



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

    let mainCategories = getMainCategories(foods);


    let extremisten = [
        'Hard caramels',
        'Coconut',
        'Popcorn',
        'Rhubarb, raw',
        'Beef shoulder'
    ]

    let flours = [
        'Semi w. flour 720',
        'High ash flour 1100',
        'Wholemeal flour 1700',
        'Bakery flour 550',
        'White flour 400',
    ];

    let ausgeglichene = [
        'Cashew nut',
        'Whole milk powd.',
        'Pistachio, dried',
        'Cheese quiche',
        'Fish sticks',
    ];


    let goodbadugly = [
        'Dried beans',
        'Dried lentil',
        'Pommes Chips',
        'Cocoa powder',
        'Dried yeast',
        'Whole milk powd.',
    ];

    let includedFoods = goodbadugly;


    foods = foods.filter(food => includedFoods.indexOf(food.name) !== -1);

    

    let colorScale = d3.scaleOrdinal()
        .domain(mainCategories)
        .range(categoryColors);



    // 'Global' variables used in most methods.
    let axesNames = d3.keys(foods[0]).filter( function(key)  { return (key !== 'name' && key !== 'category') });
    let dTheta = 2 * Math.PI / axesNames.length;
    let axesAngles = axesNames.map((key, idx) => idx * dTheta);
    let margin = { top: 30, right: 30, bottom: 30, left: 30 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    let R = d3.min([width, height]) / 2;
    let r = 30;
    let radialScaleMax = 100; // Make 100g the max for the radial scales.
    let radialScale = d3.scaleLinear()
        .domain([0, radialScaleMax])
        .range([r, R]);
    let center = [width / 2, height / 2];

    let spiderChart = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .append("g")
        .attr('class', "spider-chart")
        .attr("transform", "translate(" + center[0] + "," + center[1] + ")");

    // The order of drawing the different elements is important.
    let nrOfGuidingLines = 6;
    drawGuidinLines(spiderChart, nrOfGuidingLines);
    drawAxes(spiderChart);
    let polygonsGroup = spiderChart.append('g')
        .attr('id', 'food-polygons');
    drawPolygons(polygonsGroup);
    drawCenterPolygon(spiderChart);
    let pointsGroup = spiderChart.append('g')
        .attr('id', 'polygon-points');
    // drawPolygonPoints(pointsGroup);




    function drawPolygons(polygonsGroup) {

        foods.forEach(function (food, idx) {
            

            polygonsGroup.append('polygon')
                .attr('class', 'food-polygon')
                .attr('stroke', colorScale(food.category))
                .attr('fill', colorScale(food.category))
                .attr('points', getPolygonPoints(food));

            getPolygonPoints(food).forEach(function(point, index) {
                polygonsGroup.append('circle')
                    .attr('class', 'endpoint')
                    .attr('cx', point[0])
                    .attr('cy', point[1])
                    .attr('r', 4)
                    .attr('fill', colorScale(food.category));
            });
        });
    }

    function drawAxes(spiderChart) {
        let adaptedAxesAngles = adaptAxesAnglesToSvg();
        let axes = createAxes();
        axes.forEach(function (axis, idx) {
            var axisSelection = spiderChart.append('g')
                .attr('class', 'axis')
                .attr('transform', 'rotate(' + adaptedAxesAngles[idx] + ')')
                .call(axis);

            axisSelection.selectAll("text")
                .attr('class', "tick-text")
                .attr("transform", "rotate(180), translate(-3, -3)")


            axisSelection.selectAll(".domain")
                .attr('stroke', '#C7B3A4');

            axisSelection.append('text')
                .attr('class', 'axis-text')
                .attr('y', R + 15)
                .attr('transform', 'rotate(' + -adaptedAxesAngles[idx] + ',0,' + (R + 15) + ')')
                .attr('text-anchor', getTextAnchor(adaptedAxesAngles[idx]))
                .text(axesNames[idx].toUpperCase());
        });

        function adaptAxesAnglesToSvg() {
            return axesAngles.map(function (axisAngle) {
                return svgHasADifferentZeroAngle(axisAngle * 180 / Math.PI);
            });

            function svgHasADifferentZeroAngle(angle) {
                if (angle >= 180) {
                    return angle - 180;
                } else {
                    return angle + 180;
                }
            }
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

        function createAxes() {
            return axesNames.map(function (axis, idx) {
                if (idx === 0) {
                    return d3.axisLeft(radialScale)
                        .ticks(5)
                        .tickSize(0);
                } else {
                    return d3.axisLeft(radialScale)
                        .ticks(0)
                        .tickSize(0);
                }
            });
        }
    }

    function drawPolygonPoints(pointsGroup) {
        foods.forEach(function (food, idx) {
            getPolygonPoints(food)
                .forEach(function (point) {
                    pointsGroup.append('circle')
                        .attr('class', 'food-points')
                        .attr('fill', colorScale(food.category))
                        .attr('cx', point[0])
                        .attr('cy', point[1]);
                });
        });
    }

    function drawCenterPolygon(spiderChart) {
        spiderChart.append('g')
            .append('polygon')
            .attr('class', 'center-polygon')
            .attr('points', getCenterPolygon());

        function getCenterPolygon() {
            return axesAngles.map(function (axisAngle) {
                var angle = axisAngle - Math.PI / 2;
                return [Math.cos(angle) * r, Math.sin(angle) * r];
            });
        }
    }

    function getPolygonPoints(food) {
        return axesNames.map(function (axisName, idx) {
            var angle = axesAngles[idx] - Math.PI / 2;
            var radius = radialScale(food[axisName]);
            return [Math.cos(angle) * radius, Math.sin(angle) * radius];
        });
    }

    function drawGuidinLines(spiderChart, nrOfGuidingLines) {
        let guidingLines = createGuidingLines(nrOfGuidingLines, [r, R]);
        guidingLines.forEach(function (guidingLine) {
            spiderChart.append('g')
                .append('path')
                .attr('class', 'guiding-line')
                .attr('d', guidingLine);
        });

        function createGuidingLines(nrOfGuidingLines, minMaxRadius) {
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
    }
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
