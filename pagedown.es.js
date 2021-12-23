var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _set, _isUniverse, _element, _history, _historyPtr, _mode, _modes, _listener, _saveState, _changeMode, _inputHandler;
function noop() {
}
const identity = (x) => x;
function assign(tar, src) {
  for (const k in src)
    tar[k] = src[k];
  return tar;
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
const is_client = typeof window !== "undefined";
let now = is_client ? () => window.performance.now() : () => Date.now();
let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
const tasks = new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
function append(target, node) {
  target.appendChild(node);
}
function get_root_for_style(node) {
  if (!node)
    return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
  if (root && root.host) {
    return root;
  }
  return node.ownerDocument;
}
function append_empty_stylesheet(node) {
  const style_element = element("style");
  append_stylesheet(get_root_for_style(node), style_element);
  return style_element;
}
function append_stylesheet(node, style) {
  append(node.head || node, style);
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  node.parentNode.removeChild(node);
}
function element(name) {
  return document.createElement(name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
  const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
  for (const key in attributes) {
    if (attributes[key] == null) {
      node.removeAttribute(key);
    } else if (key === "style") {
      node.style.cssText = attributes[key];
    } else if (key === "__value") {
      node.value = node[key] = attributes[key];
    } else if (descriptors[key] && descriptors[key].set) {
      node[key] = attributes[key];
    } else {
      attr(node, key, attributes[key]);
    }
  }
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_input_value(input, value) {
  input.value = value == null ? "" : value;
}
function toggle_class(element2, name, toggle) {
  element2.classList[toggle ? "add" : "remove"](name);
}
function custom_event(type, detail, bubbles = false) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, false, detail);
  return e;
}
const active_docs = new Set();
let active = 0;
function hash(str) {
  let hash2 = 5381;
  let i = str.length;
  while (i--)
    hash2 = (hash2 << 5) - hash2 ^ str.charCodeAt(i);
  return hash2 >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
  const step = 16.666 / duration;
  let keyframes = "{\n";
  for (let p = 0; p <= 1; p += step) {
    const t = a + (b - a) * ease(p);
    keyframes += p * 100 + `%{${fn(t, 1 - t)}}
`;
  }
  const rule = keyframes + `100% {${fn(b, 1 - b)}}
}`;
  const name = `__svelte_${hash(rule)}_${uid}`;
  const doc = get_root_for_style(node);
  active_docs.add(doc);
  const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
  const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
  if (!current_rules[name]) {
    current_rules[name] = true;
    stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
  }
  const animation = node.style.animation || "";
  node.style.animation = `${animation ? `${animation}, ` : ""}${name} ${duration}ms linear ${delay}ms 1 both`;
  active += 1;
  return name;
}
function delete_rule(node, name) {
  const previous = (node.style.animation || "").split(", ");
  const next = previous.filter(name ? (anim) => anim.indexOf(name) < 0 : (anim) => anim.indexOf("__svelte") === -1);
  const deleted = previous.length - next.length;
  if (deleted) {
    node.style.animation = next.join(", ");
    active -= deleted;
    if (!active)
      clear_rules();
  }
}
function clear_rules() {
  raf(() => {
    if (active)
      return;
    active_docs.forEach((doc) => {
      const stylesheet = doc.__svelte_stylesheet;
      let i = stylesheet.cssRules.length;
      while (i--)
        stylesheet.deleteRule(i);
      doc.__svelte_rules = {};
    });
    active_docs.clear();
  });
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
const seen_callbacks = new Set();
let flushidx = 0;
function flush() {
  const saved_component = current_component;
  do {
    while (flushidx < dirty_components.length) {
      const component = dirty_components[flushidx];
      flushidx++;
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
let promise;
function wait() {
  if (!promise) {
    promise = Promise.resolve();
    promise.then(() => {
      promise = null;
    });
  }
  return promise;
}
function dispatch(node, direction, kind) {
  node.dispatchEvent(custom_event(`${direction ? "intro" : "outro"}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block))
      return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2)
          block.d(1);
        callback();
      }
    });
    block.o(local);
  }
}
const null_transition = { duration: 0 };
function create_bidirectional_transition(node, fn, params, intro) {
  let config = fn(node, params);
  let t = intro ? 0 : 1;
  let running_program = null;
  let pending_program = null;
  let animation_name = null;
  function clear_animation() {
    if (animation_name)
      delete_rule(node, animation_name);
  }
  function init2(program, duration) {
    const d = program.b - t;
    duration *= Math.abs(d);
    return {
      a: t,
      b: program.b,
      d,
      duration,
      start: program.start,
      end: program.start + duration,
      group: program.group
    };
  }
  function go(b) {
    const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
    const program = {
      start: now() + delay,
      b
    };
    if (!b) {
      program.group = outros;
      outros.r += 1;
    }
    if (running_program || pending_program) {
      pending_program = program;
    } else {
      if (css) {
        clear_animation();
        animation_name = create_rule(node, t, b, duration, delay, easing, css);
      }
      if (b)
        tick(0, 1);
      running_program = init2(program, duration);
      add_render_callback(() => dispatch(node, b, "start"));
      loop((now2) => {
        if (pending_program && now2 > pending_program.start) {
          running_program = init2(pending_program, duration);
          pending_program = null;
          dispatch(node, running_program.b, "start");
          if (css) {
            clear_animation();
            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
          }
        }
        if (running_program) {
          if (now2 >= running_program.end) {
            tick(t = running_program.b, 1 - t);
            dispatch(node, running_program.b, "end");
            if (!pending_program) {
              if (running_program.b) {
                clear_animation();
              } else {
                if (!--running_program.group.r)
                  run_all(running_program.group.c);
              }
            }
            running_program = null;
          } else if (now2 >= running_program.start) {
            const p = now2 - running_program.start;
            t = running_program.a + running_program.d * easing(p / running_program.duration);
            tick(t, 1 - t);
          }
        }
        return !!(running_program || pending_program);
      });
    }
  }
  return {
    run(b) {
      if (is_function(config)) {
        wait().then(() => {
          config = config();
          go(b);
        });
      } else {
        go(b);
      }
    },
    end() {
      clear_animation();
      running_program = pending_program = null;
    }
  };
}
function get_spread_update(levels, updates) {
  const update2 = {};
  const to_null_out = {};
  const accounted_for = { $$scope: 1 };
  let i = levels.length;
  while (i--) {
    const o = levels[i];
    const n = updates[i];
    if (n) {
      for (const key in o) {
        if (!(key in n))
          to_null_out[key] = 1;
      }
      for (const key in n) {
        if (!accounted_for[key]) {
          update2[key] = n[key];
          accounted_for[key] = 1;
        }
      }
      levels[i] = n;
    } else {
      for (const key in o) {
        accounted_for[key] = 1;
      }
    }
  }
  for (const key in to_null_out) {
    if (!(key in update2))
      update2[key] = void 0;
  }
  return update2;
}
function create_component(block) {
  block && block.c();
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, on_mount, on_destroy, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);
      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: null,
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }
  set_current_component(parent_component);
}
class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  $on(type, callback) {
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1)
        callbacks.splice(index, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
}
var wmdButtons = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xNCA4YzAtMS41LTEuNi0zLTMuNS0zSDV2MTJoNi4zYzEuNyAwIDMuMi0xLjcgMy4yLTMuNSAwLTEuMy0uOS0yLjUtMi0zIC44LS42IDEuNS0xIDEuNS0yLjV6TTcuNSA3SDEwYTEuNSAxLjUgMCAwMTAgM0g3LjVWN3ptMyA4aC0zdi0zaDNhMS41IDEuNSAwIDExMCAzek0zMiA1djJoMi42bC0zLjcgOEgyOHYyaDh2LTJoLTIuNmwzLjctOEg0MFY1aC04ek01MC4yIDEzLjhjLjUuNCAxIC43IDEuNi45bC43LTEuOGE0LjEgNC4xIDAgMTE0LS44bDEuMiAxLjRhNiA2IDAgMTAtNy41LjN6IiBmaWxsPSIjNTM1QTYwIi8+PHBhdGggZD0iTTUzLjYgOC4yYTYgNiAwIDAwLTEuNi0uOEw1MS40IDlhNC4xIDQuMSAwIDExLTQgLjhMNDYgOC40YTYgNiAwIDEwNy41LS4yek02MyA3YzAtMS4xLjktMiAyLTJoM2EyIDIgMCAwMTIgMnY3bC0xLjggM0g2NmwxLjgtM0g2NWEyIDIgMCAwMS0yLTJWN3pNNzEgN2MwLTEuMS45LTIgMi0yaDNhMiAyIDAgMDEyIDJ2N2wtMS44IDNINzRsMS44LTNINzNhMiAyIDAgMDEtMi0yVjd6TTEwMyA1YzAtMS4xLjktMiAyLTJoMTJhMiAyIDAgMDEyIDJ2MTJhMiAyIDAgMDEtMiAyaC0xMmEyIDIgMCAwMS0yLTJWNXptNC41IDcuNUwxMDQgMTdoMTRsLTQuNS02LTMuNSA0LjUtMi41LTN6bTAtNC41YTEuNSAxLjUgMCAxMDAtMyAxLjUgMS41IDAgMDAwIDN6TTE4NCAxMGgxNHYyaC0xNHYtMnoiIGZpbGw9IiM1MzVBNjAiLz48cGF0aCBvcGFjaXR5PSIuNCIgZD0iTTE4NCA0aDE0djFoLTE0VjR6bTAgM2gxNHYxaC0xNFY3em0wIDdoMTR2MWgtMTR2LTF6bTAgM2gxNHYxaC0xNHYtMXoiIGZpbGw9IiM1MzVBNjAiLz48cGF0aCBkPSJNMjUxIDNhOCA4IDAgMTAwIDE2IDggOCAwIDAwMC0xNnptLjggMTIuMWMwIC43LS41IDEuMi0xLjIgMS4ycy0xLjItLjUtMS4yLTEuMmMwLS44LjYtMS4yIDEuMi0xLjIuNyAwIDEuMi41IDEuMiAxLjJ6bTItNS4xbC0xIDEtLjYuMy0uNS43di43cy0uMS4yLS4zLjJIMjUwYy0uMiAwLS4yLS4xLS4yLS4yIDAtLjYuMS0xLjIuNC0xLjYuNC0uNS45LTEgMS40LTEuMy4yIDAgLjMtLjIuNC0uM2ExLjMgMS4zIDAgMDAwLTEuOGMtLjItLjMtLjUtLjQtMS0uNHMtLjguMy0xIC42Yy0uMi4zLS4yLjctLjIgMWgtMmMwLTEuMy40LTIuMiAxLjItMi43LjUtLjMgMS4xLS41IDEuOS0uNSAxIDAgMS44LjIgMi41LjcuNi41IDEgMS4yIDEgMi4yIDAgLjUtLjMgMS0uNSAxLjR6IiBmaWxsPSIjNTM1QTYwIi8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yNjIgNWMwLTEuMS45LTIgMi0yaDEwbDQgNHYxMGEyIDIgMCAwMS0yIDJoLTEyYTIgMiAwIDAxLTItMlY1em05LjcgMmwtMS40IDEuNCAyLjYgMi42LTIuNiAyLjYgMS40IDEuNCA0LTQtNC00em0tMiAxLjRMMjY4LjMgN2wtNCA0IDQgNCAxLjQtMS40LTIuNi0yLjYgMi42LTIuNnpNMjMwIDNhOCA4IDAgMDE1LjYgMi4zTDIzOCAzdjdoLTdsMy4yLTMuMkE2IDYgMCAwMDIzMCA1YTYgNiAwIDAwMCAxMnYyYTggOCAwIDExMC0xNnoiIGZpbGw9IiM1MzVBNjAiLz48cGF0aCBmaWxsPSIjNTM1QTYwIiBkPSJNMTYzIDRoMTR2MmgtMTR6TTE2NSA3aDEwdjJoLTEweiIvPjxwYXRoIG9wYWNpdHk9Ii40IiBmaWxsPSIjNTM1QTYwIiBkPSJNMTYzIDExaDE0djFoLTE0ek0xNjUgMTRoMTB2MWgtMTB6TTE2MyAxN2gxNHYxaC0xNHoiLz48cGF0aCBkPSJNODcgOS41VjcuMmMwLTEgLjgtMS40IDItMS40VjRjLTIuNSAwLTQgMS00IDMuMXYyLjFjMCAuNC0uMy44LS44LjhIODN2MmgxLjJjLjUgMCAuOC40LjguOHYyYzAgMi4yIDEuNSAzLjIgNCAzLjJ2LTEuOGMtMS4yIDAtMi0uNC0yLTEuNHYtMi4zYzAtLjktLjctMS40LTEuMS0xLjUuNC0uMSAxLjEtLjYgMS4xLTEuNXpNOTQgOS41VjcuMmMwLTEtLjgtMS40LTItMS40VjRjMi41IDAgNCAxIDQgMy4xdjIuMWMwIC40LjMuOC44LjhIOTh2MmgtMS4yYy0uNSAwLS44LjQtLjguOHYyYzAgMi4yLTEuNSAzLjItNCAzLjJ2LTEuOGMxLjIgMCAyLS40IDItMS40di0yLjNjMC0uOS43LTEuNCAxLjEtMS41LS40LS4xLTEuMS0uNi0xLjEtMS41eiIgZmlsbD0iIzUzNUE2MCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTI0IDhoMVY0aC0ydjFoMXYzem0uOCAySDEyM1Y5aDN2LjlsLTEuOCAyLjFoMS44djFoLTN2LS45bDEuOC0yLjF6bS0xLjggNXYtMWgzdjRoLTN2LTFoMnYtLjVoLTF2LTFoMVYxNWgtMnptNS04VjVoOXYyaC05em0wIDEwaDl2LTJoLTl2MnptOS01aC05di0yaDl2MnoiIGZpbGw9IiM1MzVBNjAiLz48cGF0aCBkPSJNMTQ2LjMgNmExLjMgMS4zIDAgMTEtMi42IDAgMS4zIDEuMyAwIDAxMi42IDB6TTE1NyA3aC05VjVoOXYyek0xNTcgMTdoLTl2LTJoOXYyek0xNDggMTJoOXYtMmgtOXYyek0xNDYuMyAxNmExLjMgMS4zIDAgMTEtMi42IDAgMS4zIDEuMyAwIDAxMi42IDB6TTE0NSAxMi4zYTEuMyAxLjMgMCAxMDAtMi42IDEuMyAxLjMgMCAwMDAgMi42eiIgZmlsbD0iIzUzNUE2MCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjEwIDNhOCA4IDAgMDAtNS42IDIuM0wyMDIgM3Y3aDdsLTMuMi0zLjJBNiA2IDAgMDEyMTAgNWE2IDYgMCAwMTAgMTJ2MmE4IDggMCAxMDAtMTZ6IiBmaWxsPSIjNTM1QTYwIi8+PHBhdGggZD0iTTE0IDI4YzAtMS41LTEuNi0zLTMuNS0zSDV2MTJoNi4zYzEuNyAwIDMuMi0xLjcgMy4yLTMuNSAwLTEuMy0uOS0yLjUtMi0zIC44LS42IDEuNS0xIDEuNS0yLjV6bS02LjUtMUgxMGExLjUgMS41IDAgMTEwIDNINy41di0zem0zIDhoLTN2LTNoM2ExLjUgMS41IDAgMTEwIDN6TTMyIDI1djJoMi42bC0zLjcgOEgyOHYyaDh2LTJoLTIuNmwzLjctOEg0MHYtMmgtOHpNNTAuMiAzMy44Yy41LjQgMSAuNyAxLjYuOWwuNy0xLjhhNC4xIDQuMSAwIDExNC0uOGwxLjIgMS40YTYgNiAwIDEwLTcuNS4zeiIgZmlsbD0iI0M4Q0NEMCIvPjxwYXRoIGQ9Ik01My42IDI4LjJhNiA2IDAgMDAtMS42LS44bC0uNiAxLjdhNC4xIDQuMSAwIDExLTQgLjhMNDYgMjguNGE2IDYgMCAxMDcuNS0uMnpNNjMgMjdjMC0xLjEuOS0yIDItMmgzYTIgMiAwIDAxMiAydjdsLTEuOCAzSDY2bDEuOC0zSDY1YTIgMiAwIDAxLTItMnYtNXpNNzEgMjdjMC0xLjEuOS0yIDItMmgzYTIgMiAwIDAxMiAydjdsLTEuOCAzSDc0bDEuOC0zSDczYTIgMiAwIDAxLTItMnYtNXpNMTAzIDI1YzAtMS4xLjktMiAyLTJoMTJhMiAyIDAgMDEyIDJ2MTJhMiAyIDAgMDEtMiAyaC0xMmEyIDIgMCAwMS0yLTJWMjV6bTQuNSA3LjVMMTA0IDM3aDE0bC00LjUtNi0zLjUgNC41LTIuNS0zem0wLTQuNWExLjUgMS41IDAgMTAwLTMgMS41IDEuNSAwIDAwMCAzek0xODQgMzBoMTR2MmgtMTR2LTJ6IiBmaWxsPSIjQzhDQ0QwIi8+PHBhdGggb3BhY2l0eT0iLjQiIGQ9Ik0xODQgMjRoMTR2MWgtMTR2LTF6bTAgM2gxNHYxaC0xNHYtMXptMCA3aDE0djFoLTE0di0xem0wIDNoMTR2MWgtMTR2LTF6IiBmaWxsPSIjQzhDQ0QwIi8+PHBhdGggZD0iTTI1MSAyM2E4IDggMCAxMDAgMTYgOCA4IDAgMDAwLTE2em0uOCAxMi4xYzAgLjctLjUgMS4yLTEuMiAxLjJzLTEuMi0uNS0xLjItMS4yYzAtLjguNi0xLjIgMS4yLTEuMi43IDAgMS4yLjUgMS4yIDEuMnptMi01LjFsLTEgMS0uNi4zLS41Ljd2LjdzLS4xLjItLjMuMkgyNTBjLS4yIDAtLjItLjEtLjItLjIgMC0uNi4xLTEuMi40LTEuNi40LS41LjktMSAxLjQtMS4zLjIgMCAuMy0uMi40LS4zYTEuMyAxLjMgMCAwMDAtMS44Yy0uMi0uMy0uNS0uNC0xLS40cy0uOC4zLTEgLjZjLS4yLjMtLjIuNy0uMiAxaC0yYzAtMS4zLjQtMi4yIDEuMi0yLjcuNS0uMyAxLjEtLjUgMS45LS41IDEgMCAxLjguMiAyLjUuNy42LjUgMSAxLjIgMSAyLjIgMCAuNS0uMyAxLS41IDEuNHoiIGZpbGw9IiNDOENDRDAiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTI2MiAyNWMwLTEuMS45LTIgMi0yaDEwbDQgNHYxMGEyIDIgMCAwMS0yIDJoLTEyYTIgMiAwIDAxLTItMlYyNXptOS43IDJsLTEuNCAxLjQgMi42IDIuNi0yLjYgMi42IDEuNCAxLjQgNC00LTQtNHptLTIgMS40bC0xLjQtMS40LTQgNCA0IDQgMS40LTEuNC0yLjYtMi42IDIuNi0yLjZ6TTIzMCAyM2E4IDggMCAwMTUuNiAyLjRMMjM4IDIzdjdoLTdsMy4yLTMuMkE2IDYgMCAwMDIzMCAyNWE2IDYgMCAwMDAgMTJ2MmE4IDggMCAxMTAtMTZ6IiBmaWxsPSIjQzhDQ0QwIi8+PHBhdGggZmlsbD0iI0M4Q0NEMCIgZD0iTTE2MyAyNGgxNHYyaC0xNHpNMTY1IDI3aDEwdjJoLTEweiIvPjxwYXRoIG9wYWNpdHk9Ii40IiBmaWxsPSIjQzhDQ0QwIiBkPSJNMTYzIDMxaDE0djFoLTE0ek0xNjUgMzRoMTB2MWgtMTB6TTE2MyAzN2gxNHYxaC0xNHoiLz48cGF0aCBkPSJNODcgMjkuNXYtMi4zYzAtMSAuOC0xLjQgMi0xLjRWMjRjLTIuNSAwLTQgMS00IDMuMXYyLjFjMCAuNC0uMy44LS44LjhIODN2MmgxLjJjLjUgMCAuOC40LjguOHYyYzAgMi4yIDEuNSAzLjIgNCAzLjJ2LTEuOGMtMS4yIDAtMi0uNC0yLTEuNHYtMi4zYzAtLjktLjctMS40LTEuMS0xLjUuNC0uMSAxLjEtLjYgMS4xLTEuNXpNOTQgMjkuNXYtMi4zYzAtMS0uOC0xLjQtMi0xLjRWMjRjMi41IDAgNCAxIDQgMy4xdjIuMWMwIC40LjMuOC44LjhIOTh2MmgtMS4yYy0uNSAwLS44LjQtLjguOHYyYzAgMi4yLTEuNSAzLjItNCAzLjJ2LTEuOGMxLjIgMCAyLS40IDItMS40di0yLjNjMC0uOS43LTEuNCAxLjEtMS41LS40LS4xLTEuMS0uNi0xLjEtMS41eiIgZmlsbD0iI0M4Q0NEMCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTI0IDI4aDF2LTRoLTJ2MWgxdjN6bS44IDJIMTIzdi0xaDN2LjlsLTEuOCAyLjFoMS44djFoLTN2LS45bDEuOC0yLjF6bS0xLjggNXYtMWgzdjRoLTN2LTFoMnYtLjVoLTF2LTFoMVYzNWgtMnptNS04di0yaDl2MmgtOXptMCAxMGg5di0yaC05djJ6bTktNWgtOXYtMmg5djJ6IiBmaWxsPSIjQzhDQ0QwIi8+PHBhdGggZD0iTTE0Ni4zIDI2YTEuMyAxLjMgMCAxMS0yLjYgMCAxLjMgMS4zIDAgMDEyLjYgMHpNMTU3IDI3aC05di0yaDl2MnpNMTU3IDM3aC05di0yaDl2MnpNMTQ4IDMyaDl2LTJoLTl2MnpNMTQ2LjMgMzZhMS4zIDEuMyAwIDExLTIuNiAwIDEuMyAxLjMgMCAwMTIuNiAwek0xNDUgMzIuM2ExLjMgMS4zIDAgMTAwLTIuNiAxLjMgMS4zIDAgMDAwIDIuNnoiIGZpbGw9IiNDOENDRDAiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIxMCAyM2E4IDggMCAwMC01LjYgMi40TDIwMiAyM3Y3aDdsLTMuMi0zLjJBNiA2IDAgMDEyMTAgMjVhNiA2IDAgMDEwIDEydjJhOCA4IDAgMTAwLTE2eiIgZmlsbD0iI0M4Q0NEMCIvPjxwYXRoIGQ9Ik0xNCA0OGMwLTEuNS0xLjYtMy0zLjUtM0g1djEyaDYuM2MxLjcgMCAzLjItMS43IDMuMi0zLjUgMC0xLjMtLjktMi41LTItMyAuOC0uNiAxLjUtMSAxLjUtMi41em0tNi41LTFIMTBhMS41IDEuNSAwIDExMCAzSDcuNXYtM3ptMyA4aC0zdi0zaDNhMS41IDEuNSAwIDExMCAzek0zMiA0NXYyaDIuNmwtMy43IDhIMjh2Mmg4di0yaC0yLjZsMy43LThINDB2LTJoLTh6TTUwLjIgNTMuOGMuNS40IDEgLjcgMS42LjlsLjctMS44YTQuMSA0LjEgMCAxMTQtLjhsMS4yIDEuNGE2IDYgMCAxMC03LjUuM3oiIGZpbGw9IiMwQzBEMEUiLz48cGF0aCBkPSJNNTMuNiA0OC4yYTYgNiAwIDAwLTEuNi0uOGwtLjYgMS43YTQuMSA0LjEgMCAxMS00IC44TDQ2IDQ4LjRhNiA2IDAgMTA3LjUtLjJ6TTYzIDQ3YzAtMS4xLjktMiAyLTJoM2EyIDIgMCAwMTIgMnY3bC0xLjggM0g2NmwxLjgtM0g2NWEyIDIgMCAwMS0yLTJ2LTV6TTcxIDQ3YzAtMS4xLjktMiAyLTJoM2EyIDIgMCAwMTIgMnY3bC0xLjggM0g3NGwxLjgtM0g3M2EyIDIgMCAwMS0yLTJ2LTV6TTEwMyA0NWMwLTEuMS45LTIgMi0yaDEyYTIgMiAwIDAxMiAydjEyYTIgMiAwIDAxLTIgMmgtMTJhMiAyIDAgMDEtMi0yVjQ1em00LjUgNy41TDEwNCA1N2gxNGwtNC41LTYtMy41IDQuNS0yLjUtM3ptMC00LjVhMS41IDEuNSAwIDEwMC0zIDEuNSAxLjUgMCAwMDAgM3pNMTg0IDUwaDE0djJoLTE0di0yeiIgZmlsbD0iIzBDMEQwRSIvPjxwYXRoIG9wYWNpdHk9Ii40IiBkPSJNMTg0IDQ0aDE0djFoLTE0di0xem0wIDNoMTR2MWgtMTR2LTF6bTAgN2gxNHYxaC0xNHYtMXptMCAzaDE0djFoLTE0di0xeiIgZmlsbD0iIzBDMEQwRSIvPjxwYXRoIGQ9Ik0yNTEgNDNhOCA4IDAgMTAwIDE2IDggOCAwIDAwMC0xNnptLjggMTIuMWMwIC43LS41IDEuMi0xLjIgMS4ycy0xLjItLjUtMS4yLTEuMmMwLS44LjYtMS4yIDEuMi0xLjIuNyAwIDEuMi41IDEuMiAxLjJ6bTItNS4xbC0xIDEtLjYuMy0uNS43di43cy0uMS4yLS4zLjJIMjUwYy0uMiAwLS4yLS4xLS4yLS4yIDAtLjYuMS0xLjIuNC0xLjYuNC0uNS45LTEgMS40LTEuMy4yIDAgLjMtLjIuNC0uM2ExLjMgMS4zIDAgMDAwLTEuOGMtLjItLjMtLjUtLjQtMS0uNHMtLjguMy0xIC42Yy0uMi4zLS4yLjctLjIgMWgtMmMwLTEuMy40LTIuMiAxLjItMi43LjUtLjMgMS4xLS41IDEuOS0uNSAxIDAgMS44LjIgMi41LjcuNi41IDEgMS4yIDEgMi4yIDAgLjUtLjMgMS0uNSAxLjR6IiBmaWxsPSIjMEMwRDBFIi8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yNjIgNDVjMC0xLjEuOS0yIDItMmgxMGw0IDR2MTBhMiAyIDAgMDEtMiAyaC0xMmEyIDIgMCAwMS0yLTJWNDV6bTkuNyAybC0xLjQgMS40IDIuNiAyLjYtMi42IDIuNiAxLjQgMS40IDQtNC00LTR6bS0yIDEuNGwtMS40LTEuNC00IDQgNCA0IDEuNC0xLjQtMi42LTIuNiAyLjYtMi42ek0yMzAgNDNhOCA4IDAgMDE1LjYgMi40TDIzOCA0M3Y3aC03bDMuMi0zLjJBNiA2IDAgMDAyMzAgNDVhNiA2IDAgMDAwIDEydjJhOCA4IDAgMTEwLTE2eiIgZmlsbD0iIzBDMEQwRSIvPjxwYXRoIGZpbGw9IiMwQzBEMEUiIGQ9Ik0xNjMgNDRoMTR2MmgtMTR6TTE2NSA0N2gxMHYyaC0xMHoiLz48cGF0aCBvcGFjaXR5PSIuNCIgZmlsbD0iIzBDMEQwRSIgZD0iTTE2MyA1MWgxNHYxaC0xNHpNMTY1IDU0aDEwdjFoLTEwek0xNjMgNTdoMTR2MWgtMTR6Ii8+PHBhdGggZD0iTTg3IDQ5LjV2LTIuM2MwLTEgLjgtMS40IDItMS40VjQ0Yy0yLjUgMC00IDEtNCAzLjF2Mi4xYzAgLjQtLjMuOC0uOC44SDgzdjJoMS4yYy41IDAgLjguNC44Ljh2MmMwIDIuMiAxLjUgMy4yIDQgMy4ydi0xLjhjLTEuMiAwLTItLjQtMi0xLjR2LTIuM2MwLS45LS43LTEuNC0xLjEtMS41LjQtLjEgMS4xLS42IDEuMS0xLjV6TTk0IDQ5LjV2LTIuM2MwLTEtLjgtMS40LTItMS40VjQ0YzIuNSAwIDQgMSA0IDMuMXYyLjFjMCAuNC4zLjguOC44SDk4djJoLTEuMmMtLjUgMC0uOC40LS44Ljh2MmMwIDIuMi0xLjUgMy4yLTQgMy4ydi0xLjhjMS4yIDAgMi0uNCAyLTEuNHYtMi4zYzAtLjkuNy0xLjQgMS4xLTEuNS0uNC0uMS0xLjEtLjYtMS4xLTEuNXoiIGZpbGw9IiMwQzBEMEUiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEyNCA0OGgxdi00aC0ydjFoMXYzem0uOCAySDEyM3YtMWgzdi45bC0xLjggMi4xaDEuOHYxaC0zdi0uOWwxLjgtMi4xem0tMS44IDV2LTFoM3Y0aC0zdi0xaDJ2LS41aC0xdi0xaDFWNTVoLTJ6bTUtOHYtMmg5djJoLTl6bTAgMTBoOXYtMmgtOXYyem05LTVoLTl2LTJoOXYyeiIgZmlsbD0iIzBDMEQwRSIvPjxwYXRoIGQ9Ik0xNDYuMyA0NmExLjMgMS4zIDAgMTEtMi42IDAgMS4zIDEuMyAwIDAxMi42IDB6TTE1NyA0N2gtOXYtMmg5djJ6TTE1NyA1N2gtOXYtMmg5djJ6TTE0OCA1Mmg5di0yaC05djJ6TTE0Ni4zIDU2YTEuMyAxLjMgMCAxMS0yLjYgMCAxLjMgMS4zIDAgMDEyLjYgMHpNMTQ1IDUyLjNhMS4zIDEuMyAwIDEwMC0yLjYgMS4zIDEuMyAwIDAwMCAyLjV6IiBmaWxsPSIjMEMwRDBFIi8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yMTAgNDNhOCA4IDAgMDAtNS42IDIuNEwyMDIgNDN2N2g3bC0zLjItMy4yQTYgNiAwIDAxMjEwIDQ1YTYgNiAwIDAxMCAxMnYyYTggOCAwIDEwMC0xNnoiIGZpbGw9IiMwQzBEMEUiLz48cGF0aCBkPSJNMjk1LjUgMThoLTMuMWwtNS40LTcuNmMtLjguNS0xLjMgMS40LTEuNCAyLjhMMjg1IDE4aC0yLjZsLjUtNC44Yy4zLTIuMyAxLjItMy44IDIuOC00LjZMMjgyLjQgNGgzLjFsNC41IDYuMy45LS44LjUtMS4yLjYtNC4zaDIuNmwtLjMgMi45YTguMiA4LjIgMCAwMS0xIDMuMWMtLjMuOC0xIDEuNS0yIDJsNC4yIDZ6IiBmaWxsPSIjNTM1QTYwIi8+PHBhdGggZD0iTTI5NS41IDM4aC0zLjFsLTUuNC03LjZjLS44LjUtMS4zIDEuNC0xLjQgMi44TDI4NSAzOGgtMi42bC41LTQuOGMuMy0yLjMgMS4yLTMuOCAyLjgtNC42bC0zLjMtNC42aDMuMWw0LjUgNi4zLjktLjguNS0xLjIuNi00LjNoMi42bC0uMyAyLjlhOC4yIDguMiAwIDAxLTEgMy4xYy0uMy44LTEgMS41LTIgMmw0LjIgNnoiIGZpbGw9IiNDOENDRDAiLz48cGF0aCBkPSJNMjk1LjUgNThoLTMuMWwtNS40LTcuNmMtLjguNS0xLjMgMS40LTEuNCAyLjhMMjg1IDU4aC0yLjZsLjUtNC44Yy4zLTIuMyAxLjItMy44IDIuOC00LjZsLTMuMy00LjZoMy4xbDQuNSA2LjMuOS0uOC41LTEuMi42LTQuM2gyLjZsLS4zIDIuOWE4LjIgOC4yIDAgMDEtMSAzLjFjLS4zLjgtMSAxLjUtMiAybDQuMiA2eiIgZmlsbD0iIzBDMEQwRSIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzAzIDNhMiAyIDAgMDAtMiAydjEyYzAgMS4xLjkgMiAyIDJoMTJhMiAyIDAgMDAyLTJWNWEyIDIgMCAwMC0yLTJoLTEyem0xMiAyaC0xMnYzaDEyVjV6bS0xMiA1aDN2N2gtM3YtN3ptMTIgMGgtN3Y3aDd2LTd6IiBmaWxsPSIjNTM1QTYwIi8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zMDMgNDNhMiAyIDAgMDAtMiAydjEyYzAgMS4xLjkgMiAyIDJoMTJhMiAyIDAgMDAyLTJWNDVhMiAyIDAgMDAtMi0yaC0xMnptMTIgMmgtMTJ2M2gxMnYtM3ptLTEyIDVoM3Y3aC0zdi03em0xMiAwaC03djdoN3YtN3oiIGZpbGw9IiMwQzBEMEUiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMwMyAyM2EyIDIgMCAwMC0yIDJ2MTJjMCAxLjEuOSAyIDIgMmgxMmEyIDIgMCAwMDItMlYyNWEyIDIgMCAwMC0yLTJoLTEyem0xMiAyaC0xMnYzaDEydi0zem0tMTIgNWgzdjdoLTN2LTd6bTEyIDBoLTd2N2g3di03eiIgZmlsbD0iI0M4Q0NEMCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzI3IDJoLTJ2MmgtMmEyIDIgMCAwMC0yIDJ2MTBjMCAxLjEuOSAyIDIgMmg0LjJsMi40IDEuOCAyLjktMi45IDEgMS4xaDEuNWEyIDIgMCAwMDItMlY2YTIgMiAwIDAwLTItMmgtNFYybC00IDNWMnptMCAzbDQgM1Y2aDR2NWgtNVY5aC0ydjZoMnYtMmg1djNoLS42bC0xLjktMi0zIDMuMi0xLjctMS4ySDMyM3YtM2gydjJoMlY5aC0ydjJoLTJWNmgydjJoMlY1eiIgZmlsbD0iIzUzNUE2MCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzI3IDIyaC0ydjJoLTJhMiAyIDAgMDAtMiAydjEwYzAgMS4xLjkgMiAyIDJoNC4ybDIuNCAxLjggMi45LTIuOSAxIDEuMWgxLjVhMiAyIDAgMDAyLTJWMjZhMiAyIDAgMDAtMi0yaC00di0ybC00IDN2LTN6bTAgM2w0IDN2LTJoNHY1aC01di0yaC0ydjZoMnYtMmg1djNoLS42bC0xLjktMi0zIDMuMi0xLjctMS4ySDMyM3YtM2gydjJoMnYtNmgtMnYyaC0ydi01aDJ2Mmgydi0zeiIgZmlsbD0iI0M4Q0NEMCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzI3IDQyaC0ydjJoLTJhMiAyIDAgMDAtMiAydjEwYzAgMS4xLjkgMiAyIDJoNC4ybDIuNCAxLjggMi45LTIuOSAxIDEuMWgxLjVhMiAyIDAgMDAyLTJWNDZhMiAyIDAgMDAtMi0yaC00di0ybC00IDN2LTN6bTAgM2w0IDN2LTJoNHY1aC01di0yaC0ydjZoMnYtMmg1djNoLS42bC0xLjktMi0zIDMuMi0xLjctMS4ySDMyM3YtM2gydjJoMnYtNmgtMnYyaC0ydi01aDJ2Mmgydi0zeiIgZmlsbD0iIzBDMEQwRSIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzQxIDVjMC0xLjEuOS0yIDItMmgxMmEyIDIgMCAwMTIgMnY4YTIgMiAwIDAxLTIgMmgtMXY0bC00LTRoLTdhMiAyIDAgMDEtMi0yVjV6bTMuOSA0YzAtMS4yIDEtMi4xIDIuMS0yLjFoMVY1aC0xYTQgNCAwIDEwMCA4aDF2LTEuOWgtMWMtMS4yIDAtMi4xLTEtMi4xLTIuMXptNi4xLTRoLTF2MS45aDFhMi4xIDIuMSAwIDExMCA0LjJoLTFWMTNoMWE0IDQgMCAxMDAtOHptMCA1aC00VjhoNHYyeiIgZmlsbD0iIzUzNUE2MCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzQxIDI1YzAtMS4xLjktMiAyLTJoMTJhMiAyIDAgMDEyIDJ2OGEyIDIgMCAwMS0yIDJoLTF2NGwtNC00aC03YTIgMiAwIDAxLTItMnYtOHptMy45IDRjMC0xLjIgMS0yLjEgMi4xLTIuMWgxVjI1aC0xYTQgNCAwIDEwMCA4aDF2LTEuOWgtMWMtMS4yIDAtMi4xLTEtMi4xLTIuMXptNi4xLTRoLTF2MS45aDFhMi4xIDIuMSAwIDExMCA0LjJoLTFWMzNoMWE0IDQgMCAxMDAtOHptMCA1aC00di0yaDR2MnoiIGZpbGw9IiNDOENDRDAiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTM0MSA0NWMwLTEuMS45LTIgMi0yaDEyYTIgMiAwIDAxMiAydjhhMiAyIDAgMDEtMiAyaC0xdjRsLTQtNGgtN2EyIDIgMCAwMS0yLTJ2LTh6bTMuOSA0YzAtMS4yIDEtMi4xIDIuMS0yLjFoMVY0NWgtMWE0IDQgMCAxMDAgOGgxdi0xLjloLTFjLTEuMiAwLTIuMS0xLTIuMS0yLjF6bTYuMS00aC0xdjEuOWgxYTIuMSAyLjEgMCAxMTAgNC4yaC0xVjUzaDFhNCA0IDAgMTAwLTh6bTAgNWgtNHYtMmg0djJ6IiBmaWxsPSIjMEMwRDBFIi8+PC9zdmc+";
var ButtonBar_svelte_svelte_type_style_lang = "";
function create_fragment$2(ctx) {
  let main;
  let input0;
  let input0_style_value;
  let t0;
  let input1;
  let input1_style_value;
  let t1;
  let span0;
  let t2;
  let input2;
  let input2_style_value;
  let t3;
  let input3;
  let input3_style_value;
  let t4;
  let input4;
  let input4_style_value;
  let t5;
  let input5;
  let input5_style_value;
  let t6;
  let span1;
  let t7;
  let input6;
  let input6_style_value;
  let t8;
  let input7;
  let input7_style_value;
  let t9;
  let input8;
  let input8_style_value;
  let t10;
  let input9;
  let input9_style_value;
  let t11;
  let span2;
  let t12;
  let input10;
  let input10_style_value;
  let t13;
  let input11;
  let input11_style_value;
  let mounted;
  let dispose;
  let input0_levels = [
    {
      style: input0_style_value = `${ctx[5]}: 0`
    },
    ctx[4]
  ];
  let input0_data = {};
  for (let i = 0; i < input0_levels.length; i += 1) {
    input0_data = assign(input0_data, input0_levels[i]);
  }
  let input1_levels = [
    {
      style: input1_style_value = `${ctx[5]}: -20px`
    },
    ctx[4]
  ];
  let input1_data = {};
  for (let i = 0; i < input1_levels.length; i += 1) {
    input1_data = assign(input1_data, input1_levels[i]);
  }
  let input2_levels = [
    {
      style: input2_style_value = `${ctx[5]}: -42px`
    },
    ctx[4]
  ];
  let input2_data = {};
  for (let i = 0; i < input2_levels.length; i += 1) {
    input2_data = assign(input2_data, input2_levels[i]);
  }
  let input3_levels = [
    {
      style: input3_style_value = `${ctx[5]}: -60px`
    },
    ctx[4]
  ];
  let input3_data = {};
  for (let i = 0; i < input3_levels.length; i += 1) {
    input3_data = assign(input3_data, input3_levels[i]);
  }
  let input4_levels = [
    {
      style: input4_style_value = `${ctx[5]}: -80px`
    },
    ctx[4]
  ];
  let input4_data = {};
  for (let i = 0; i < input4_levels.length; i += 1) {
    input4_data = assign(input4_data, input4_levels[i]);
  }
  let input5_levels = [
    {
      style: input5_style_value = `${ctx[5]}: -101px`
    },
    ctx[4]
  ];
  let input5_data = {};
  for (let i = 0; i < input5_levels.length; i += 1) {
    input5_data = assign(input5_data, input5_levels[i]);
  }
  let input6_levels = [
    {
      style: input6_style_value = `${ctx[5]}: -120px`
    },
    ctx[4]
  ];
  let input6_data = {};
  for (let i = 0; i < input6_levels.length; i += 1) {
    input6_data = assign(input6_data, input6_levels[i]);
  }
  let input7_levels = [
    {
      style: input7_style_value = `${ctx[5]}: -140px`
    },
    ctx[4]
  ];
  let input7_data = {};
  for (let i = 0; i < input7_levels.length; i += 1) {
    input7_data = assign(input7_data, input7_levels[i]);
  }
  let input8_levels = [
    {
      style: input8_style_value = `${ctx[5]}: -160px`
    },
    ctx[4]
  ];
  let input8_data = {};
  for (let i = 0; i < input8_levels.length; i += 1) {
    input8_data = assign(input8_data, input8_levels[i]);
  }
  let input9_levels = [
    {
      style: input9_style_value = `${ctx[5]}: -180px`
    },
    ctx[4]
  ];
  let input9_data = {};
  for (let i = 0; i < input9_levels.length; i += 1) {
    input9_data = assign(input9_data, input9_levels[i]);
  }
  let input10_levels = [
    {
      style: input10_style_value = `${ctx[5]}: -200px`
    },
    { disabled: ctx[0] },
    ctx[4]
  ];
  let input10_data = {};
  for (let i = 0; i < input10_levels.length; i += 1) {
    input10_data = assign(input10_data, input10_levels[i]);
  }
  let input11_levels = [
    {
      style: input11_style_value = `${ctx[5]}: -220px`
    },
    { disabled: ctx[1] },
    ctx[4]
  ];
  let input11_data = {};
  for (let i = 0; i < input11_levels.length; i += 1) {
    input11_data = assign(input11_data, input11_levels[i]);
  }
  return {
    c() {
      main = element("main");
      input0 = element("input");
      t0 = space();
      input1 = element("input");
      t1 = space();
      span0 = element("span");
      t2 = space();
      input2 = element("input");
      t3 = space();
      input3 = element("input");
      t4 = space();
      input4 = element("input");
      t5 = space();
      input5 = element("input");
      t6 = space();
      span1 = element("span");
      t7 = space();
      input6 = element("input");
      t8 = space();
      input7 = element("input");
      t9 = space();
      input8 = element("input");
      t10 = space();
      input9 = element("input");
      t11 = space();
      span2 = element("span");
      t12 = space();
      input10 = element("input");
      t13 = space();
      input11 = element("input");
      set_attributes(input0, input0_data);
      toggle_class(input0, "svelte-r3si5d", true);
      set_attributes(input1, input1_data);
      toggle_class(input1, "svelte-r3si5d", true);
      attr(span0, "class", "pagedown-bar-spacer");
      set_attributes(input2, input2_data);
      toggle_class(input2, "svelte-r3si5d", true);
      set_attributes(input3, input3_data);
      toggle_class(input3, "svelte-r3si5d", true);
      set_attributes(input4, input4_data);
      toggle_class(input4, "svelte-r3si5d", true);
      set_attributes(input5, input5_data);
      toggle_class(input5, "svelte-r3si5d", true);
      attr(span1, "class", "pagedown-bar-spacer");
      set_attributes(input6, input6_data);
      toggle_class(input6, "svelte-r3si5d", true);
      set_attributes(input7, input7_data);
      toggle_class(input7, "svelte-r3si5d", true);
      set_attributes(input8, input8_data);
      toggle_class(input8, "svelte-r3si5d", true);
      set_attributes(input9, input9_data);
      toggle_class(input9, "svelte-r3si5d", true);
      attr(span2, "class", "pagedown-bar-spacer");
      set_attributes(input10, input10_data);
      toggle_class(input10, "svelte-r3si5d", true);
      set_attributes(input11, input11_data);
      toggle_class(input11, "svelte-r3si5d", true);
      attr(main, "class", "svelte-r3si5d");
    },
    m(target, anchor) {
      insert(target, main, anchor);
      append(main, input0);
      if (input0.autofocus)
        input0.focus();
      append(main, t0);
      append(main, input1);
      if (input1.autofocus)
        input1.focus();
      append(main, t1);
      append(main, span0);
      append(main, t2);
      append(main, input2);
      if (input2.autofocus)
        input2.focus();
      append(main, t3);
      append(main, input3);
      if (input3.autofocus)
        input3.focus();
      append(main, t4);
      append(main, input4);
      if (input4.autofocus)
        input4.focus();
      append(main, t5);
      append(main, input5);
      if (input5.autofocus)
        input5.focus();
      append(main, t6);
      append(main, span1);
      append(main, t7);
      append(main, input6);
      if (input6.autofocus)
        input6.focus();
      append(main, t8);
      append(main, input7);
      if (input7.autofocus)
        input7.focus();
      append(main, t9);
      append(main, input8);
      if (input8.autofocus)
        input8.focus();
      append(main, t10);
      append(main, input9);
      if (input9.autofocus)
        input9.focus();
      append(main, t11);
      append(main, span2);
      append(main, t12);
      append(main, input10);
      if (input10.autofocus)
        input10.focus();
      append(main, t13);
      append(main, input11);
      if (input11.autofocus)
        input11.focus();
      if (!mounted) {
        dispose = [
          listen(input0, "click", ctx[3]("bold")),
          listen(input1, "click", ctx[3]("italic")),
          listen(input2, "click", ctx[2]("link")),
          listen(input3, "click", ctx[3]("quote")),
          listen(input4, "click", ctx[3]("code")),
          listen(input5, "click", ctx[2]("image")),
          listen(input6, "click", ctx[3]("nlist")),
          listen(input7, "click", ctx[3]("dlist")),
          listen(input8, "click", ctx[3]("header")),
          listen(input9, "click", ctx[3]("bar")),
          listen(input10, "click", ctx[3]("undo")),
          listen(input11, "click", ctx[3]("redo"))
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      set_attributes(input0, input0_data = get_spread_update(input0_levels, [{ style: input0_style_value }, ctx2[4]]));
      toggle_class(input0, "svelte-r3si5d", true);
      set_attributes(input1, input1_data = get_spread_update(input1_levels, [{ style: input1_style_value }, ctx2[4]]));
      toggle_class(input1, "svelte-r3si5d", true);
      set_attributes(input2, input2_data = get_spread_update(input2_levels, [{ style: input2_style_value }, ctx2[4]]));
      toggle_class(input2, "svelte-r3si5d", true);
      set_attributes(input3, input3_data = get_spread_update(input3_levels, [{ style: input3_style_value }, ctx2[4]]));
      toggle_class(input3, "svelte-r3si5d", true);
      set_attributes(input4, input4_data = get_spread_update(input4_levels, [{ style: input4_style_value }, ctx2[4]]));
      toggle_class(input4, "svelte-r3si5d", true);
      set_attributes(input5, input5_data = get_spread_update(input5_levels, [{ style: input5_style_value }, ctx2[4]]));
      toggle_class(input5, "svelte-r3si5d", true);
      set_attributes(input6, input6_data = get_spread_update(input6_levels, [{ style: input6_style_value }, ctx2[4]]));
      toggle_class(input6, "svelte-r3si5d", true);
      set_attributes(input7, input7_data = get_spread_update(input7_levels, [{ style: input7_style_value }, ctx2[4]]));
      toggle_class(input7, "svelte-r3si5d", true);
      set_attributes(input8, input8_data = get_spread_update(input8_levels, [{ style: input8_style_value }, ctx2[4]]));
      toggle_class(input8, "svelte-r3si5d", true);
      set_attributes(input9, input9_data = get_spread_update(input9_levels, [{ style: input9_style_value }, ctx2[4]]));
      toggle_class(input9, "svelte-r3si5d", true);
      set_attributes(input10, input10_data = get_spread_update(input10_levels, [
        { style: input10_style_value },
        dirty & 1 && { disabled: ctx2[0] },
        ctx2[4]
      ]));
      toggle_class(input10, "svelte-r3si5d", true);
      set_attributes(input11, input11_data = get_spread_update(input11_levels, [
        { style: input11_style_value },
        dirty & 2 && { disabled: ctx2[1] },
        ctx2[4]
      ]));
      toggle_class(input11, "svelte-r3si5d", true);
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(main);
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance$2($$self, $$props, $$invalidate) {
  let current = null;
  let { buttons } = $$props;
  let { undoDisabled = true } = $$props;
  let { redoDisabled = true } = $$props;
  function uncheck() {
    current.checked = false;
    current = null;
  }
  function handleCheck(name) {
    return function() {
      if (current === this) {
        uncheck();
      } else {
        current = this;
      }
      buttons[name]();
    };
  }
  function handleClick(name) {
    return function(evt) {
      evt.preventDefault();
      evt.target.checked = false;
      if (current === null) {
        buttons[name]();
      }
    };
  }
  const buttonProps = {
    type: "radio",
    class: "pagedown-bar-button",
    name: "buttonBar"
  };
  const btnStyle = `background-image: url(${wmdButtons}); background-position-x`;
  $$self.$$set = ($$props2) => {
    if ("buttons" in $$props2)
      $$invalidate(6, buttons = $$props2.buttons);
    if ("undoDisabled" in $$props2)
      $$invalidate(0, undoDisabled = $$props2.undoDisabled);
    if ("redoDisabled" in $$props2)
      $$invalidate(1, redoDisabled = $$props2.redoDisabled);
  };
  return [
    undoDisabled,
    redoDisabled,
    handleCheck,
    handleClick,
    buttonProps,
    btnStyle,
    buttons,
    uncheck
  ];
}
class ButtonBar extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$2, create_fragment$2, safe_not_equal, {
      buttons: 6,
      undoDisabled: 0,
      redoDisabled: 1,
      uncheck: 7
    });
  }
  get uncheck() {
    return this.$$.ctx[7];
  }
}
function cubicOut(t) {
  const f = t - 1;
  return f * f * f + 1;
}
function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
  const style = getComputedStyle(node);
  const opacity = +style.opacity;
  const height = parseFloat(style.height);
  const padding_top = parseFloat(style.paddingTop);
  const padding_bottom = parseFloat(style.paddingBottom);
  const margin_top = parseFloat(style.marginTop);
  const margin_bottom = parseFloat(style.marginBottom);
  const border_top_width = parseFloat(style.borderTopWidth);
  const border_bottom_width = parseFloat(style.borderBottomWidth);
  return {
    delay,
    duration,
    easing,
    css: (t) => `overflow: hidden;opacity: ${Math.min(t * 20, 1) * opacity};height: ${t * height}px;padding-top: ${t * padding_top}px;padding-bottom: ${t * padding_bottom}px;margin-top: ${t * margin_top}px;margin-bottom: ${t * margin_bottom}px;border-top-width: ${t * border_top_width}px;border-bottom-width: ${t * border_bottom_width}px;`
  };
}
var Popup_svelte_svelte_type_style_lang = "";
function create_if_block_1(ctx) {
  let aside;
  let strong;
  let t1;
  let p;
  let input0;
  let t2;
  let input1;
  let t3;
  let input2;
  let aside_transition;
  let current;
  let mounted;
  let dispose;
  return {
    c() {
      aside = element("aside");
      strong = element("strong");
      strong.textContent = "Insert Hyperlink";
      t1 = space();
      p = element("p");
      input0 = element("input");
      t2 = space();
      input1 = element("input");
      t3 = space();
      input2 = element("input");
      attr(input0, "type", "text");
      attr(input0, "class", "pagedown-input svelte-1wdwetg");
      attr(input1, "type", "submit");
      input1.value = "Add link";
      attr(input1, "class", "pagedown-button svelte-1wdwetg");
      attr(input2, "type", "submit");
      input2.value = "Cancel";
      attr(input2, "class", "pagedown-button pagedown-button-empty svelte-1wdwetg");
      attr(aside, "class", "pagedown-popup");
    },
    m(target, anchor) {
      insert(target, aside, anchor);
      append(aside, strong);
      append(aside, t1);
      append(aside, p);
      append(p, input0);
      set_input_value(input0, ctx[1].value);
      append(p, t2);
      append(p, input1);
      append(p, t3);
      append(p, input2);
      current = true;
      if (!mounted) {
        dispose = [
          listen(input0, "keyup", ctx[9]),
          listen(input0, "input", ctx[10]),
          listen(input1, "click", function() {
            if (is_function(ctx[1].add))
              ctx[1].add.apply(this, arguments);
          }),
          listen(input2, "click", function() {
            if (is_function(ctx[1].cancel))
              ctx[1].cancel.apply(this, arguments);
          }),
          listen(aside, "outroend", ctx[3])
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & 2 && input0.value !== ctx[1].value) {
        set_input_value(input0, ctx[1].value);
      }
    },
    i(local) {
      if (current)
        return;
      add_render_callback(() => {
        if (!aside_transition)
          aside_transition = create_bidirectional_transition(aside, slide, { duration: 100 }, true);
        aside_transition.run(1);
      });
      current = true;
    },
    o(local) {
      if (!aside_transition)
        aside_transition = create_bidirectional_transition(aside, slide, { duration: 100 }, false);
      aside_transition.run(0);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(aside);
      if (detaching && aside_transition)
        aside_transition.end();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block(ctx) {
  let aside;
  let blockquote;
  let t3;
  let p0;
  let t4;
  let strong1;
  let t6;
  let p1;
  let input0;
  let t7;
  let input1;
  let t8;
  let input2;
  let aside_transition;
  let current;
  let mounted;
  let dispose;
  return {
    c() {
      aside = element("aside");
      blockquote = element("blockquote");
      blockquote.innerHTML = `Images are useful in a post, but
        <strong>make sure the post is still clear without them.</strong>
        If you post images of code or error messages, copy and paste or
        type the actual code or message into the post directly.`;
      t3 = space();
      p0 = element("p");
      t4 = space();
      strong1 = element("strong");
      strong1.textContent = "Insert Image Link";
      t6 = space();
      p1 = element("p");
      input0 = element("input");
      t7 = space();
      input1 = element("input");
      t8 = space();
      input2 = element("input");
      attr(blockquote, "class", "pagedown-notice");
      attr(input0, "type", "text");
      attr(input0, "class", "pagedown-input svelte-1wdwetg");
      attr(input1, "type", "submit");
      input1.value = "Add Image";
      attr(input1, "class", "pagedown-button svelte-1wdwetg");
      attr(input2, "type", "submit");
      input2.value = "Cancel";
      attr(input2, "class", "pagedown-button pagedown-button-empty svelte-1wdwetg");
      attr(aside, "class", "pagedown-popup");
    },
    m(target, anchor) {
      insert(target, aside, anchor);
      append(aside, blockquote);
      append(aside, t3);
      append(aside, p0);
      append(aside, t4);
      append(aside, strong1);
      append(aside, t6);
      append(aside, p1);
      append(p1, input0);
      set_input_value(input0, ctx[0].value);
      append(p1, t7);
      append(p1, input1);
      append(p1, t8);
      append(p1, input2);
      current = true;
      if (!mounted) {
        dispose = [
          listen(input0, "keyup", ctx[7]),
          listen(input0, "input", ctx[8]),
          listen(input1, "click", function() {
            if (is_function(ctx[0].add))
              ctx[0].add.apply(this, arguments);
          }),
          listen(input2, "click", function() {
            if (is_function(ctx[0].cancel))
              ctx[0].cancel.apply(this, arguments);
          }),
          listen(aside, "outroend", ctx[3])
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & 1 && input0.value !== ctx[0].value) {
        set_input_value(input0, ctx[0].value);
      }
    },
    i(local) {
      if (current)
        return;
      add_render_callback(() => {
        if (!aside_transition)
          aside_transition = create_bidirectional_transition(aside, slide, { duration: 100 }, true);
        aside_transition.run(1);
      });
      current = true;
    },
    o(local) {
      if (!aside_transition)
        aside_transition = create_bidirectional_transition(aside, slide, { duration: 100 }, false);
      aside_transition.run(0);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(aside);
      if (detaching && aside_transition)
        aside_transition.end();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_fragment$1(ctx) {
  let main;
  let current_block_type_index;
  let if_block;
  let current;
  const if_block_creators = [create_if_block, create_if_block_1];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (ctx2[2] === "image")
      return 0;
    if (ctx2[2] === "link")
      return 1;
    return -1;
  }
  if (~(current_block_type_index = select_block_type(ctx))) {
    if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  }
  return {
    c() {
      main = element("main");
      if (if_block)
        if_block.c();
      attr(main, "class", "svelte-1wdwetg");
    },
    m(target, anchor) {
      insert(target, main, anchor);
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].m(main, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if (~current_block_type_index) {
          if_blocks[current_block_type_index].p(ctx2, dirty);
        }
      } else {
        if (if_block) {
          group_outros();
          transition_out(if_blocks[previous_block_index], 1, 1, () => {
            if_blocks[previous_block_index] = null;
          });
          check_outros();
        }
        if (~current_block_type_index) {
          if_block = if_blocks[current_block_type_index];
          if (!if_block) {
            if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
            if_block.c();
          } else {
            if_block.p(ctx2, dirty);
          }
          transition_in(if_block, 1);
          if_block.m(main, null);
        } else {
          if_block = null;
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(main);
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].d();
      }
    }
  };
}
function instance$1($$self, $$props, $$invalidate) {
  let { image } = $$props;
  let { link } = $$props;
  let current = "";
  let next = "";
  function show(name) {
    if (current === "") {
      $$invalidate(2, current = name);
    } else if (current === name) {
      $$invalidate(2, current = "");
    } else {
      $$invalidate(2, current = "");
      next = name;
    }
  }
  function hide() {
    show(current);
  }
  function isShowing() {
    return next !== "" || current !== "";
  }
  function unlock() {
    if (next !== "") {
      $$invalidate(2, current = next);
      next = "";
    }
  }
  const keyup_handler = (evt) => evt.key === "Enter" && image.add();
  function input0_input_handler() {
    image.value = this.value;
    $$invalidate(0, image);
  }
  const keyup_handler_1 = (evt) => evt.key === "Enter" && link.add();
  function input0_input_handler_1() {
    link.value = this.value;
    $$invalidate(1, link);
  }
  $$self.$$set = ($$props2) => {
    if ("image" in $$props2)
      $$invalidate(0, image = $$props2.image);
    if ("link" in $$props2)
      $$invalidate(1, link = $$props2.link);
  };
  return [
    image,
    link,
    current,
    unlock,
    show,
    hide,
    isShowing,
    keyup_handler,
    input0_input_handler,
    keyup_handler_1,
    input0_input_handler_1
  ];
}
class Popup extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$1, create_fragment$1, safe_not_equal, {
      image: 0,
      link: 1,
      show: 4,
      hide: 5,
      isShowing: 6
    });
  }
  get show() {
    return this.$$.ctx[4];
  }
  get hide() {
    return this.$$.ctx[5];
  }
  get isShowing() {
    return this.$$.ctx[6];
  }
}
class SelfSet {
  constructor(set, isUniverse) {
    __privateAdd(this, _set, void 0);
    __privateAdd(this, _isUniverse, void 0);
    __privateSet(this, _isUniverse, isUniverse);
    __privateSet(this, _set, [...set, this]);
  }
  contains(other) {
    if (__privateGet(this, _isUniverse)) {
      return true;
    } else {
      return __privateGet(this, _set).includes(other);
    }
  }
}
_set = new WeakMap();
_isUniverse = new WeakMap();
class Mode extends SelfSet {
  shouldSaveOn(newMode) {
    return !this.contains(newMode);
  }
}
class InputManager {
  constructor(element2) {
    __privateAdd(this, _element, void 0);
    __privateAdd(this, _history, void 0);
    __privateAdd(this, _historyPtr, void 0);
    __privateAdd(this, _mode, void 0);
    __privateAdd(this, _modes, void 0);
    __privateAdd(this, _listener, void 0);
    __privateAdd(this, _saveState, () => {
      if (__privateGet(this, _historyPtr) < __privateGet(this, _history).length - 1) {
        __privateSet(this, _history, __privateGet(this, _history).slice(0, __privateGet(this, _historyPtr) + 1));
      }
      __privateGet(this, _history).push({
        value: __privateGet(this, _element).value,
        selectionStart: __privateGet(this, _element).selectionStart,
        selectionEnd: __privateGet(this, _element).selectionEnd
      });
      __privateSet(this, _historyPtr, __privateGet(this, _historyPtr) + 1);
    });
    __privateAdd(this, _changeMode, (newModeName) => {
      const newMode = __privateGet(this, _modes)[newModeName];
      console.log("Moving to ", newModeName, __privateGet(this, _mode).shouldSaveOn(newMode));
      if (__privateGet(this, _mode).shouldSaveOn(newMode)) {
        __privateGet(this, _saveState).call(this);
      }
      __privateSet(this, _mode, newMode);
    });
    __privateAdd(this, _inputHandler, (evt) => {
      if (evt instanceof MouseEvent) {
        __privateGet(this, _changeMode).call(this, "Select|Move");
      } else if (evt instanceof KeyboardEvent) {
        const cmdKey = evt.metaKey || evt.ctrlKey;
        const shfKey = evt.shiftKey;
        const zKey = evt.key === "z" || evt.key === "Z";
        const yKey = evt.key === "y" || evt.key === "Y";
        const xKey = evt.key === "x" || evt.key === "X";
        const vKey = evt.key === "v" || evt.key === "V";
        const navKey = [
          "ArrowLeft",
          "ArrowUp",
          "ArrowRight",
          "ArrowDown",
          "Home",
          "End",
          "PageUp",
          "PageDown"
        ].includes(evt.key);
        const backspace = evt.key === "Backspace";
        const newLine = evt.key === "Enter";
        const tabKey = evt.key === "Tab";
        const paste = cmdKey && vKey;
        const cut = cmdKey && xKey;
        const redo = cmdKey && (yKey || zKey && shfKey);
        const undo = cmdKey && zKey && !redo;
        const typing = [...evt.key].length === 1 && !cmdKey;
        if (backspace) {
          __privateGet(this, _changeMode).call(this, "Delete");
        } else if (newLine || paste || cut) {
          __privateGet(this, _changeMode).call(this, "Line|Paste|Cut");
          __privateGet(this, _changeMode).call(this, "Typing");
        } else if (undo || redo) {
          evt.preventDefault();
          if (undo && this.canUndo() || redo && this.canRedo()) {
            __privateGet(this, _changeMode).call(this, "History");
            __privateSet(this, _historyPtr, __privateGet(this, _historyPtr) + (redo ? 1 : -1));
            Object.assign(__privateGet(this, _element), __privateGet(this, _history)[__privateGet(this, _historyPtr)]);
          }
        } else if (navKey) {
          __privateGet(this, _changeMode).call(this, "Select|Move");
        } else if (typing) {
          __privateGet(this, _changeMode).call(this, "Typing");
        } else if (tabKey) {
          __privateGet(this, _changeMode).call(this, "Typing");
          evt.preventDefault();
          this.setSelectText("	", false);
        }
        __privateGet(this, _listener).call(this);
      }
    });
    __privateSet(this, _element, element2);
    __privateSet(this, _history, [{ value: "", selectionStart: 0, selectionEnd: 0 }]);
    __privateSet(this, _historyPtr, 0);
    __privateSet(this, _listener, () => {
      return;
    });
    __privateSet(this, _mode, new Mode([], false));
    __privateSet(this, _modes, {
      "Select|Move": __privateGet(this, _mode),
      "Typing": new Mode([__privateGet(this, _mode)], false),
      "Delete": new Mode([__privateGet(this, _mode)], false),
      "Line|Paste|Cut": new Mode([], true),
      "History": new Mode([], true)
    });
    __privateGet(this, _element).addEventListener("keydown", __privateGet(this, _inputHandler));
    __privateGet(this, _element).addEventListener("mousedown", __privateGet(this, _inputHandler));
    __privateGet(this, _element).addEventListener("input", () => __privateGet(this, _listener).call(this));
  }
  getSelectText() {
    return __privateGet(this, _element).value.substring(__privateGet(this, _element).selectionStart, __privateGet(this, _element).selectionEnd);
  }
  setSelectText(input, keepSelect) {
    __privateGet(this, _saveState).call(this);
    const leftHalf = __privateGet(this, _element).value.slice(0, __privateGet(this, _element).selectionStart);
    const rightHalf = __privateGet(this, _element).value.slice(__privateGet(this, _element).selectionEnd);
    __privateGet(this, _element).value = leftHalf + input + rightHalf;
    __privateGet(this, _element).selectionEnd = leftHalf.length + input.length;
    __privateGet(this, _element).selectionStart = keepSelect ? leftHalf.length : __privateGet(this, _element).selectionEnd;
    __privateGet(this, _element).focus();
    __privateGet(this, _listener).call(this);
  }
  getSelect() {
    return {
      start: __privateGet(this, _element).selectionStart,
      end: __privateGet(this, _element).selectionEnd
    };
  }
  setSelect(start, end) {
    __privateGet(this, _element).selectionStart = start;
    __privateGet(this, _element).selectionEnd = end;
    __privateGet(this, _element).focus();
  }
  getValue() {
    return __privateGet(this, _element).value;
  }
  setValue(newValue) {
    __privateGet(this, _saveState).call(this);
    __privateGet(this, _element).value = newValue;
    __privateGet(this, _listener).call(this);
  }
  setListener(listener) {
    __privateSet(this, _listener, listener);
  }
  undo() {
    __privateGet(this, _inputHandler).call(this, new KeyboardEvent("keydown", { key: "z", ctrlKey: true }));
  }
  redo() {
    __privateGet(this, _inputHandler).call(this, new KeyboardEvent("keydown", { key: "y", ctrlKey: true }));
  }
  canUndo() {
    return __privateGet(this, _historyPtr) - 1 >= 1;
  }
  canRedo() {
    return __privateGet(this, _historyPtr) + 1 < __privateGet(this, _history).length;
  }
}
_element = new WeakMap();
_history = new WeakMap();
_historyPtr = new WeakMap();
_mode = new WeakMap();
_modes = new WeakMap();
_listener = new WeakMap();
_saveState = new WeakMap();
_changeMode = new WeakMap();
_inputHandler = new WeakMap();
const header1 = /^\n?.*\n-*\n?$/;
const header2 = /^\n?.*\n=*\n?$/;
const unapplyHeader = (text2) => text2.replace(/\n?(-|=)*\n?$/, "").split("\n").join(" ").trim();
const applyHeader = (text2, dash) => {
  const headerTitle = unapplyHeader(text2);
  const headerBar = new Array(headerTitle.length).fill(dash).join("");
  return headerTitle + "\n" + headerBar + "\n";
};
const unapplyList = (text2) => text2.split("\n").map((line) => line.replace(/^ ([0-9]+\.|-) /, "")).join("\n");
function checkApply(name, text2) {
  const features = {
    bold: {
      match: /^\*{2}.*\*{2}$/,
      apply: (text22) => `**${text22}**`,
      unapply: (text22) => text22.substring(2, text22.length - 2),
      multiline: false
    },
    italic: {
      match: /^\*.*\*$/,
      apply: (text22) => `*${text22}*`,
      unapply: (text22) => /^\*{2}[^*]*\*{2}$/.test(text22) ? `*${text22}*` : text22.substring(1, text22.length - 1),
      multiline: false
    },
    quote: {
      match: /^(> .*\n)*> .*\n?$/,
      apply: (text22) => text22.split("\n").map((line) => `> ${line}`).join("\n"),
      unapply: (text22) => text22.split("\n").map((line) => line.substring(2)).join("\n"),
      multiline: true
    },
    code: {
      match: /^( {4}.*\n)* {4}.*\n?$/,
      apply: (text22) => text22.split("\n").map((line) => `    ${line}`).join("\n"),
      unapply: (text22) => text22.split("\n").map((line) => line.substring(4)).join("\n"),
      multiline: true
    },
    nlist: {
      match: /^( [0-9]+\. .*\n)* [0-9]+\. .*\n?$/,
      apply: (text22) => unapplyList(text22).split("\n").map((line, k) => ` ${k + 1}. ${line}`).join("\n"),
      unapply: unapplyList,
      multiline: true
    },
    dlist: {
      match: /^( - .*\n)* - .*\n?$/,
      apply: (text22) => unapplyList(text22).split("\n").map((line) => ` - ${line}`).join("\n"),
      unapply: unapplyList,
      multiline: true
    },
    header: {
      match: header2,
      apply: (text22) => header1.test(text22) ? applyHeader(text22, "=") : applyHeader(text22, "-"),
      unapply: unapplyHeader,
      multiline: true
    }
  };
  if (name in features) {
    const feature = features[name];
    const target = feature.multiline ? text2 : text2.split("\n").join(" ");
    if (feature.match.test(target)) {
      return feature.unapply(text2);
    } else {
      return feature.apply(text2);
    }
  } else {
    return text2;
  }
}
function markSelection(input) {
  const value = input.getValue();
  const select = input.getSelect();
  const token = crypto.randomUUID();
  return {
    value: value.slice(0, select.start) + token + value.slice(select.end),
    token
  };
}
function unmarkSelection(input, marked) {
  const selectText = input.getSelectText();
  const selectStart = marked.value.indexOf(marked.token);
  input.setValue(marked.value.replace(marked.token, selectText));
  input.setSelect(selectStart, selectStart + selectText.length);
}
function addReference(input, reference) {
  const marked = markSelection(input);
  const lines = marked.value.split("\n").map((i, k) => ({ val: i, num: k }));
  const links = lines.filter((line) => /^\s*\[[0-9]*\]:.*$/.test(line.val));
  const newLines = lines.filter((line) => !links.includes(line));
  const newLinkID = links.length + 1;
  const newLinkText = `  [${newLinkID}]: ${reference}`;
  unmarkSelection(input, {
    value: [
      ...newLines,
      ...links,
      { val: newLinkText, num: -1 }
    ].map((i) => i.val).join("\n"),
    token: marked.token
  });
  return newLinkID;
}
var Pagedown_svelte_svelte_type_style_lang = "";
function create_fragment(ctx) {
  let aside;
  let buttonbar;
  let t0;
  let popup_1;
  let t1;
  let textarea_1;
  let current;
  let buttonbar_props = {
    buttons: ctx[8],
    undoDisabled: ctx[3],
    redoDisabled: ctx[4]
  };
  buttonbar = new ButtonBar({ props: buttonbar_props });
  ctx[12](buttonbar);
  let popup_1_props = {
    link: ctx[6],
    image: ctx[7]
  };
  popup_1 = new Popup({ props: popup_1_props });
  ctx[13](popup_1);
  return {
    c() {
      aside = element("aside");
      create_component(buttonbar.$$.fragment);
      t0 = space();
      create_component(popup_1.$$.fragment);
      t1 = space();
      textarea_1 = element("textarea");
      attr(textarea_1, "class", "pagedown-textarea svelte-1m0hhjq");
      textarea_1.disabled = ctx[5];
      attr(aside, "class", "pagedown-editor");
    },
    m(target, anchor) {
      insert(target, aside, anchor);
      mount_component(buttonbar, aside, null);
      append(aside, t0);
      mount_component(popup_1, aside, null);
      append(aside, t1);
      append(aside, textarea_1);
      ctx[14](textarea_1);
      current = true;
    },
    p(ctx2, [dirty]) {
      const buttonbar_changes = {};
      if (dirty & 8)
        buttonbar_changes.undoDisabled = ctx2[3];
      if (dirty & 16)
        buttonbar_changes.redoDisabled = ctx2[4];
      buttonbar.$set(buttonbar_changes);
      const popup_1_changes = {};
      if (dirty & 64)
        popup_1_changes.link = ctx2[6];
      if (dirty & 128)
        popup_1_changes.image = ctx2[7];
      popup_1.$set(popup_1_changes);
      if (!current || dirty & 32) {
        textarea_1.disabled = ctx2[5];
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(buttonbar.$$.fragment, local);
      transition_in(popup_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(buttonbar.$$.fragment, local);
      transition_out(popup_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(aside);
      ctx[12](null);
      destroy_component(buttonbar);
      ctx[13](null);
      destroy_component(popup_1);
      ctx[14](null);
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let popup;
  let buttonBar;
  let textbox;
  let textarea;
  let undoDisabled;
  let redoDisabled;
  let popupShowing = false;
  function applyButton(name) {
    return () => textbox.setSelectText(checkApply(name, textbox.getSelectText()), true);
  }
  const buttonClicks = {
    bold: applyButton("bold"),
    italic: applyButton("italic"),
    link: () => {
      popup.show("link");
      $$invalidate(5, popupShowing = popup.isShowing());
    },
    image: () => {
      popup.show("image");
      $$invalidate(5, popupShowing = popup.isShowing());
    },
    quote: applyButton("quote"),
    code: applyButton("code"),
    nlist: applyButton("nlist"),
    dlist: applyButton("dlist"),
    header: applyButton("header"),
    bar: () => textbox.setSelectText("\n\n----------\n\n", true),
    undo: () => textbox.undo(),
    redo: () => textbox.redo()
  };
  function addLink() {
    const refID = addReference(textbox, popupLink.value);
    textbox.setSelectText(`[${textbox.getSelectText()}][${refID}]`, true);
    hidePopup();
  }
  function addImage() {
    const refID = addReference(textbox, popupImage.value);
    textbox.setSelectText(`![${textbox.getSelectText()}][${refID}]`, true);
    hidePopup();
  }
  function hidePopup() {
    $$invalidate(6, popupLink.value = "https://", popupLink);
    $$invalidate(7, popupImage.value = "https://", popupImage);
    $$invalidate(5, popupShowing = false);
    popup.hide();
    buttonBar.uncheck();
  }
  const popupLink = {
    add: addLink,
    cancel: hidePopup,
    value: "https://"
  };
  const popupImage = {
    add: addImage,
    cancel: hidePopup,
    value: "https://"
  };
  let listener = () => {
    return;
  };
  function setListener(newListener) {
    listener = newListener;
  }
  function getValue() {
    return textbox.getValue();
  }
  function setValue(text2) {
    return textbox.setValue(text2);
  }
  onMount(() => {
    textbox = new InputManager(textarea);
    textbox.setListener(function() {
      $$invalidate(3, undoDisabled = !textbox.canUndo());
      $$invalidate(4, redoDisabled = !textbox.canRedo());
      listener();
    });
  });
  function buttonbar_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      buttonBar = $$value;
      $$invalidate(1, buttonBar);
    });
  }
  function popup_1_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      popup = $$value;
      $$invalidate(0, popup);
    });
  }
  function textarea_1_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      textarea = $$value;
      $$invalidate(2, textarea);
    });
  }
  return [
    popup,
    buttonBar,
    textarea,
    undoDisabled,
    redoDisabled,
    popupShowing,
    popupLink,
    popupImage,
    buttonClicks,
    setListener,
    getValue,
    setValue,
    buttonbar_binding,
    popup_1_binding,
    textarea_1_binding
  ];
}
class Pagedown extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {
      setListener: 9,
      getValue: 10,
      setValue: 11
    });
  }
  get setListener() {
    return this.$$.ctx[9];
  }
  get getValue() {
    return this.$$.ctx[10];
  }
  get setValue() {
    return this.$$.ctx[11];
  }
}
export { Pagedown as default };
