
(function (global) {
  "use strict";

  const TIME = 1000;
  const MAX_RETRY = 10;
  const GITHUB = 'https://github.com';

  const cache = {};

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
    const next = doc.querySelector(".pagination > a:last-child");
    if (next && next.innerHTML === 'Next') {
      response.next = next.href;
    }
    return response;
  };

  const queryProfile = doc =>
    Object.assign({}, {
      name: doc.querySelector('.p-name').innerHTML,
      nickname: doc.querySelector('.p-nickname').innerHTML,
      image: doc.querySelector('.avatar').src
    });

  const fetchWrapper = (time, promise, params, count = 0) =>
    new Promise((resolve, reject) => {
      console.log("Fetched", params);
      const doWork = (t) => {
        setTimeout(() => {
          promise(params)
            .then(res => {
              if (res.status === 200) {
                resolve(res);
              } else if (res.status === 429) {
                if (count === MAX_RETRY) {
                  reject(res);
                } else {
                  count++;
                  console.log(`Retry - ${count}`);
                  doWork(time * 2);
                }
              } else {
                reject(res);
              }
            })
            .catch(err => reject(err));
        }, t);
      };
      doWork(time);
    });

  const fetchNodes = (from, type) =>
    fetchWrapper(TIME, fetch, _createURL(from, type))
      .then(response => response.text())
      .then(body => queryNodes(new DOMParser().parseFromString(body, 'text/html')));

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

  const fetchNetwork = user =>
    new Promise((resolve, reject) => {
      fetchAllNodesFrom(user, 'following')
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

  const fetchProfile = user =>
    (cache.hasOwnProperty(user))
      ?  new Promise((resolve) => resolve(cache[user]))
      :
        fetch(`${GITHUB}/${user}`)
          .then(response => response.text())
          .then(body => queryProfile(new DOMParser().parseFromString(body, 'text/html')))
          .then(res => cache[user] = res);

  global.GH = { fetchNetwork, fetchProfile };

})(window);
