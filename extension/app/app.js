"use strict";

const draw = graph => {

  const viewProfile = user => {
    const url = `https://github.com/${user.nickname}`;
    document.querySelector('.profile-photo').href = url;
    document.querySelector('.profile-photo__img').src = user.image;
    document.querySelector('.profile-name').innerHTML = user.name;
    document.querySelector('.profile').style.visibility = 'visible';
    document.querySelector('.profile').style.display = 'grid';
    const nickname = document.querySelector('.profile-nickname');
    nickname.innerHTML = user.nickname;
    nickname.href = url;
    document.querySelector('.profile-loading').style.display = 'none';
  };

  const diff = document.querySelector('svg').getBoundingClientRect();
  const width = window.innerWidth;
  const height = window.innerHeight - diff.top;
  const linkDistance= height / 8;

  const color = d3
    .scale
    .category20();

  const force = d3
    .layout
    .force()
    .charge([-400])
    .theta(0.1)
    .gravity(0.05)
    .linkDistance(linkDistance)
    .size([width, height]);

  const zoom = d3
    .behavior
    .zoom()
    .scaleExtent([1, 10])
    .on('zoom', () => {
      svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    });

  const svg = d3
    .select('svg')
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .call(zoom)
    .append('svg:g');

  force
    .drag()
    .on('dragstart', () => d3.event.sourceEvent.stopPropagation());

  force
    .nodes(graph.nodes)
    .links(graph.edges)
    .start();

  const link = svg
    .selectAll('.link')
    .data(graph.edges)
    .enter()
    .append('line')
    .attr('class', 'link')
    .style('marker-end', 'url(#suit)');

  const node = svg
    .selectAll('.node')
    .data(graph.nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r', 8)
    .style('fill', (d, i) => color(i))
    .call(force.drag)
    .on('click', function (d) {
      document.querySelector('.profile').style.visibility = 'hidden';
      document.querySelector('.profile').style.display = 'none';
      document.querySelector('.profile-loading').style.display = 'block';
      GH
        .fetchProfile(d.name)
        .then(res => viewProfile(res));
    })
    .on('mouseover', function (d) {
      d3
        .select(this)
        .attr('r', 12);
    })
    .on('mouseout', function (d) {
      d3
        .select(this)
        .attr('r', 8);
    })

  const nodelabels = svg
    .selectAll('.nodelabel')
    .data(graph.nodes)
    .enter()
    .append('text')
    .attr({
      'x': function(d) { return d.x; },
      'y': function(d) { return d.y; },
      'class': 'nodelabel',
      'stroke': 'black'
    })
    .text((d) => d.name);


  svg
    .append('defs')
    .selectAll('marker')
    .data(['suit', 'licensing', 'resolved'])
    .enter()
    .append('marker')
    .attr('id', d => d)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 25)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5 L10,0 L0, -5')
    .style('stroke', '#4679BD')
    .style('opacity', '0.6');

  force.on('tick', () => {
    nodelabels
      .attr('x', function(d) { return d.x; })
      .attr('y', function(d) { return d.y; });

    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
  });
};

const parseGDF = data => {
  const headerNodes = 'nodedef> name VARCHAR\n';
  const nodes = data.nodes.map(node => {
    return `${node.name}\n`;
  }).join('');
  const headerEdges = 'edgedef> node1, node2, directed BOOLEAN\n';
  const edges = data.edges.map(edge => {
    return `${edge.source.name},${edge.target.name},true\n`;
  }).join('');
  return headerNodes + nodes + headerEdges + edges;
};

function _onSuccess(data) {
  const graph = { nodes: [], edges: [] };
  const nodesIndex = Object.keys(data).reduce((g, k, index) => { g[k] = index; return g; }, {});
  graph['nodes'] = Object.keys(data).map((key, index) => {
    data[key].map(to => graph['edges'].push({ source: index, target: nodesIndex[to] }));
    return { name: key };
  });
  document.querySelector('.loading').style.display = 'none';
  document.querySelector('.content').style.visibility = 'hidden';
  document.querySelector('.content').style.display = 'none';
  document.querySelector('.download').style.display = 'block';
  document.querySelector('.download').addEventListener('click', () => download(graph));
  draw(graph);
}

function _onFail(err) {
  // TODO: Implement error handler
  document.querySelector('.loading').style.display = 'none';
  alert('Sorry, an error occurred while processing your request');
  console.error(err);
}

function download(graph) {
  const blob = new Blob([parseGDF(graph)], { type: 'application/json' });
  const filename = 'graph.gdf';
  const a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function onClick() {
  const input = document.querySelector('input');
  document.querySelector('.loading').style.display = 'block';
  GH.fetchNetwork(input.value)
    .then(_onSuccess)
    .catch(_onFail);
  input.value = '';
}

function onEnter(e) {
  if (e.keyCode === 13) {
    document.querySelector('.loading').style.display = 'block';
    GH.fetchNetwork(e.target.value)
      .then(_onSuccess)
      .catch(_onFail);
    e.target.value = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('button');
  const input = document.querySelector('input');

  button.addEventListener('click', onClick);
  input.addEventListener('keypress', onEnter);
});
