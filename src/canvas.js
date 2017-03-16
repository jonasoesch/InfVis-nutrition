import * as d3 from 'd3';

export let canvas;
export let dimensions;

export let setup = function (x=920, y=600) {
    /**
     * Configuring the canvas
     */
    dimensions = { // `let`: http://es6-features.org/#BlockScopedVariables
        margin : {top: 10, right: 10, bottom: 60, left: 60},
        width: x,
        innerWidth : function() { return this.width - this.margin.left - this.margin.right },
        height : y,
        innerHeight : function() {return this.height - this.margin.top - this.margin.bottom },
        dot: 2,
    };



    /**
     * Setting up the canvas
     */
    canvas = d3.select("body").append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .append("g")
        .attr("class", "canvas")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`); // moves the canvas to the inside

    // String interpolation with `${}`: http://es6-features.org/#StringInterpolation
};