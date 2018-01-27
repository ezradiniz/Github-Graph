"use strict";

const draw = dataset => {

  const width = window.innerWidth;
  const height = window.innerHeight;
  const linkDistance= width / 4;

  const colors = d3.scale.category10();

  const svg = d3.select('svg');

  d3.select(window)
    .on('resize.updatesvg', () => {
      svg.attr({ 'width': window.innerWidth, 'height': window.innerHeight });
    });

  const force = d3.layout.force()
    .nodes(dataset.nodes)
    .links(dataset.edges)
    .size([width, height])
    .linkDistance([linkDistance])
    .charge([-500])
    .theta(0.1)
    .gravity(0.05)
    .start();

  const edges = svg.selectAll('line')
    .data(dataset.edges)
    .enter()
    .append('line')
    .attr('id', (d, i) => 'edge' + i)
    .attr('marker-end','url(#arrowhead)')
    .style('stroke','#ccc')
    .style('pointer-events', 'none');

  const nodes = svg.selectAll('circle')
    .data(dataset.nodes)
    .enter()
    .append('circle')
    .attr({ 'r': 15 })
    .style('fill', (d, i) => colors(i))
    .call(force.drag)

  const nodelabels = svg.selectAll('.nodelabel')
    .data(dataset.nodes)
    .enter()
    .append('text')
    .attr({
      'x': function(d) { return d.x; },
      'y': function(d) { return d.y; },
      'class': 'nodelabel',
      'stroke': 'black'
    })
    .text((d) => d.name);

  const edgepaths = svg.selectAll('.edgepath')
    .data(dataset.edges)
    .enter()
    .append('path')
    .attr({
      'd': function(d) { return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y },
      'class': 'edgepath',
      'fill-opacity': 0,
      'stroke-opacity': 0,
      'fill': 'blue',
      'stroke': 'red',
      'id': function(d,i) { return 'edgepath'+i }
    })
    .style('pointer-events', 'none');

  svg.append('defs').append('marker')
    .attr({
      'id': 'arrowhead',
      'viewBox': '-0 -5 10 10',
      'refX': 25,
      'refY': 0,
      'orient': 'auto',
      'markerWidth': 10,
      'markerHeight': 10,
      'xoverflow': 'visible'
    })
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#ccc')
    .attr('stroke','#ccc');


  force.on('tick', () => {

    edges.attr({
      'x1': function(d) { return d.source.x; },
      'y1': function(d) { return d.source.y; },
      'x2': function(d) { return d.target.x; },
      'y2': function(d) { return d.target.y; }
    });

    nodes.attr({
      'cx': function(d) { return d.x; },
      'cy': function(d) { return d.y; }
    });

    nodelabels.attr('x', function(d) { return d.x; })
      .attr('y', function(d) { return d.y; });

    edgepaths.attr('d', function(d) { return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y; });
  });
};

function _onSuccess(data) {
  const graph = { nodes: [], edges: [] };
  const nodesIndex = Object.keys(data).reduce((g, k, index) => { g[k] = index; return g; }, {});
  graph['nodes'] = Object.keys(data).map((key, index) => {
    data[key].map(to => graph['edges'].push({ source: index, target: nodesIndex[to] }));
    return { name: key };
  });
  draw(graph);
}

function _onFail(err) {
  // TODO: Implement error handler
  console.error(err);
}

function onClick() {
  const input = document.querySelector('input');
  createNetwork(input.value)
    .then(_onSuccess)
    .catch(_onFail);
  input.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('button');
  button.addEventListener('click', onClick);
});
