// Filtering for /blog/: category, archive and free-text search combine (AND).
(function () {
  var list = document.getElementById('post-list');
  if (!list) return;
  var cards = Array.prototype.slice.call(list.querySelectorAll('.post-card'));
  var empty = document.getElementById('empty');
  var input = document.getElementById('post-search');
  var state = { cat: 'all', arc: 'all', q: '' };

  function apply() {
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (state.cat === 'all' || c.dataset.cat.split(' ').indexOf(state.cat) > -1) &&
               (state.arc === 'all' || c.dataset.arc.split(' ').indexOf(state.arc) > -1) &&
               (!state.q || c.dataset.text.indexOf(state.q) > -1);
      c.hidden = !ok;
      if (ok) shown++;
    });
    empty.hidden = shown !== 0;
  }

  function wire(treeId, key, attr) {
    var tree = document.getElementById(treeId);
    tree.addEventListener('click', function (e) {
      var btn = e.target.closest('.f-btn');
      if (!btn) return;
      tree.querySelectorAll('.f-btn').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      state[key] = btn.dataset[attr];
      apply();
    });
  }
  wire('cat-tree', 'cat', 'cat');
  wire('arc-tree', 'arc', 'arc');

  input.addEventListener('input', function () {
    state.q = input.value.trim().toLowerCase();
    apply();
  });
})();
