
(function (global) {
  "use strict";

  const TIME = 1000;
  const MAX_RETRY = 10;
  const GITHUB = 'https://github.com';

  const cache = {};

  const _initGraph = nodes =>
    [ ...nodes ].reduce((g, k) => {
      g[k] = [];
      return g;
    }, {});

  const _createURL = (from, type) =>
    (from.match(GITHUB)) ? from : `${GITHUB}/${from}/${type}`;

  const _queryNodes = doc => {
    const response = {};
    const followersList = [ ...doc.querySelectorAll(".follow-list-item") ];
    response.nodes = followersList.map(entry => entry.querySelector("a > img").alt.replace("@", ""));
    const next = doc.querySelector(".pagination > a:last-child");
    if (next && next.innerHTML === 'Next') {
      response.next = next.href;
    }
    return response;
  };

  const _queryProfile = doc =>
    Object.assign({}, {
      name: doc.querySelector('.p-name').innerHTML,
      nickname: doc.querySelector('.p-nickname').innerHTML,
      image: doc.querySelector('.avatar').src
    });

  const _fetchWrapper = (time, fn, params, count = 0) =>
    new Promise((resolve, reject) => {
      console.log("Fetched", params);
      const doWork = (t) => {
        setTimeout(() => {
          fn(params)
            .then(res => {
              if (res.status === 200) {
                resolve(res);
              } else if (res.status === 429) {
                if (count === MAX_RETRY) {
                  reject(res);
                } else {
                  count++;
                  console.log(`Retry - ${count}`);
                  doWork(time * 7.5);
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

  const _fetchNodes = (from, type) =>
    _fetchWrapper(TIME, fetch, _createURL(from, type))
      .then(response => response.text())
      .then(body => _queryNodes(new DOMParser().parseFromString(body, 'text/html')));

  async function fetchAllNodesFrom(from, type) {
    let nodes = [];
    let next = from;
    while (next) {
      const response = await _fetchNodes(next, type);
      nodes = [ ...nodes, ...response.nodes ];
      next = response.next;
    }
    return nodes;
  }

  async function fetchNetwork(user) {
    const nodes = new Set(await fetchAllNodesFrom(user, 'following'));
    const graph = _initGraph(nodes);
    for (const from of nodes) {
      const to = await fetchAllNodesFrom(from, 'following');
      graph[from] = to.filter(e => nodes.has(e));
    }
    return graph;
  }

  const fetchProfile = user =>
    (cache.hasOwnProperty(user))
      ?  Promise.resolve(cache[user])
      :
        fetch(`${GITHUB}/${user}`)
          .then(response => response.text())
          .then(body => _queryProfile(new DOMParser().parseFromString(body, 'text/html')))
          .then(res => cache[user] = res);

  global.GH = { fetchNetwork, fetchProfile, fetchAllNodesFrom };

})(window);
