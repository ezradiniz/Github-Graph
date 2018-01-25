"use strict"

console.log("github.js loaded");

const TIME = 1000;
const GITHUB = 'https://github.com';

function* _makeIterator(nodes) {
  for (let node of nodes) {
    yield node;
  }
}

const _initGraph = nodes =>
  [ ...nodes ].reduce((g, k) => {
    g[k] = [];
    return g;
  }, {});

const _createURL = (from, type) =>
  (from.match(GITHUB)) ? from : `${GITHUB}/${from}/${type}`;

const queryNodes = doc => {
  const response = {};
  const followersList = [ ...doc.querySelectorAll(".follow-list-item") ];
  response.nodes = followersList.map(entry => entry.querySelector("a > img").alt.replace("@", ""));
  const next = document.querySelector(".pagination > a");
  if (next) {
    response.next = next.href;
  }
  return response;
};

const fetchWrapper = (time, promise, ...params) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      promise(...params)
        .then(res => resolve(res))
        .catch(err => reject(err));
    }, time);
  });

const fetchNodes = (from, type) =>
  fetchWrapper(TIME, fetch, _createURL(from, type))
    .then(response => response.text())
    .then(body => queryNodes(new DOMParser().parseFromString(body, "text/html")));

const fetchAllNodesFrom = (from, type) =>
  new Promise((resolve, reject) => {
    const nodes = new Set();
    const doWork = (nextPage) => {
      fetchNodes(nextPage, type)
        .then(response => {
          response.nodes.map(node => nodes.add(node));
          if (response.next) {
            doWork(response.next);
          } else {
            resolve(nodes)
          }
        })
        .catch(err => reject(err));
    };
    doWork(from);
  });

const createNetwork = from =>
  new Promise((resolve, reject) => {
    fetchAllNodesFrom(from, 'followers')
      .then(followers =>
        fetchAllNodesFrom(from, 'following')
          .then(following => new Set([ ...followers ].concat([ ...following ])))
          .catch(err => reject(err))
      )
      .then(nodes => {
        const graph = _initGraph(nodes);
        const iter = _makeIterator(nodes);
        const doWork = ({ value, done }) => {
          if (done) {
            resolve(graph);
          } else {
            fetchAllNodesFrom(value, 'following')
              .then(edges => {
                graph[value] = [ ...edges ].filter(e => nodes.has(e));
                doWork(iter.next());
              })
              .catch(err => reject(err));
          }
        };
        doWork(iter.next());
      })
      .catch(err => reject(err));
  });
