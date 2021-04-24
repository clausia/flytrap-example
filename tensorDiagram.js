// by Piotr Migdał, https://p.migdal.pl/
// and Claudia Zendejas-Morales, https://claudiazm.xyz/
// inspiration from http://tensornetwork.org/diagrams/


const tensors = [
	{ x: 0, y: 0, name: "x", idEqPart: "v_x" },
  { x: 1, y: 0, name: "A", idEqPart: "M_A" },
  { x: 2, y: 0, name: "B", idEqPart: "M_B" },
];

const contractions = [
	{ source: 0, target: 1 },
  { source: 1, target: 2 },
  { source: 2, target: "right", name: "k" },
];

drawDiagram(tensors, contractions, "firstcontainer", 220, 115);

function drawDiagram(tensors, contractions, idContainer, widthContainer, heightContainer) {

  // add source/target by id or name
  contractions.forEach((d) => {
    if (typeof d.source === "number") {
      d.source = tensors[d.source]
    }
    if (typeof d.target === "number") {
      d.target = tensors[d.target]
    }
  });

  const shifts = {
    up:    [0, -0.75],
    down:  [0, 0.75],
    left:  [-0.75, 0],
    right: [0.75, 0]
  };
  
  const colorScale = d3.scaleOrdinal()
    .range(["#763E9B", "#00882B", "#C82505", "#EEEEEE", "#0165C0"]);

  contractions.forEach((d) => {
    if (typeof d.target === "string") {
      const dv = shifts[d.target];
      d.target = {
        x: d.source.x + dv[0],
        y: d.source.y + dv[1]
      };
      d.labelPosition = {
        x: d.source.x + 1.4 * dv[0],
        y: d.source.y + 1.4 * dv[1]
      };
    }
  });
  
  tensors.forEach((d) => {
    d3.select('#' + d.idEqPart).style("color", colorScale(d.name));
  });

  const xScale = d3.scaleLinear()
    .domain([0, 8])
    .range([20, 450]);

  const yScale = d3.scaleLinear()
    .domain([0, 8])
    .range([60, 450]);

  const lineFunction = d3.line()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y));

  const svg = d3.select("#" + idContainer)
              .append("svg")
              .attr("width", widthContainer)
              .attr("height", heightContainer);

  svg.selectAll(".contraction")
    .data(contractions)
    .enter()
    .append("path")
    .attr("class", "contraction")
    .attr("d", (d) => lineFunction([d.source, d.target]));

  svg.selectAll(".tensor")
    .data(tensors)
    .enter()
    .append("circle")
    .attr("class", "tensor")
    .attr("r", 10)
    .attr("cx", (d) => xScale(d.x))
    .attr("cy", (d) => yScale(d.y))
    .style("fill", (d) => colorScale(d.name))
    .on("mouseover", (event, d) => d3.select('#' + d.idEqPart).classed('circle-sketch-highlight', true))
    .on("mouseout", (event, d) => d3.select('#' + d.idEqPart).classed('circle-sketch-highlight', false));

  svg.selectAll(".tensor-label")
    .data(tensors)
    .enter()
    .append("text")
    .attr("class", "tensor-label")
    .attr("x", (d) => d.labPos === "left" ? xScale(d.x - 0.5) : xScale(d.x))
    .attr("y", (d) => d.labPos === "left" ? yScale(d.y + 0.1) : yScale(d.y - 0.4))
    .text((d) => d.name);

  svg.selectAll(".contraction-label")
    .data(contractions.filter((d) => !!d.labelPosition))
    .enter()
    .append("text")
    .attr("class", "contraction-label")
    .attr("x", (d) => xScale(d.labelPosition.x))
    .attr("y", (d) => yScale(d.labelPosition.y))
    .text((d) => d.name);
  
}