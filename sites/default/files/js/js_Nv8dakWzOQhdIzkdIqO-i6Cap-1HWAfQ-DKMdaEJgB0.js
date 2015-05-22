(function($) {

Drupal.wysiwyg.editor.init.ckeditor = function(settings) {
  // Plugins must only be loaded once. Only the settings from the first format
  // will be used but they're identical anyway.
  var registeredPlugins = {};
  for (var format in settings) {
    if (Drupal.settings.wysiwyg.plugins[format]) {
      // Register native external plugins.
      // Array syntax required; 'native' is a predefined token in JavaScript.
      for (var pluginName in Drupal.settings.wysiwyg.plugins[format]['native']) {
        if (!registeredPlugins[pluginName]) {
          var plugin = Drupal.settings.wysiwyg.plugins[format]['native'][pluginName];
          CKEDITOR.plugins.addExternal(pluginName, plugin.path, plugin.fileName);
          registeredPlugins[pluginName] = true;
        }
      }
      // Register Drupal plugins.
      for (var pluginName in Drupal.settings.wysiwyg.plugins[format].drupal) {
        if (!registeredPlugins[pluginName]) {
          Drupal.wysiwyg.editor.instance.ckeditor.addPlugin(pluginName, Drupal.settings.wysiwyg.plugins[format].drupal[pluginName], Drupal.settings.wysiwyg.plugins.drupal[pluginName]);
          registeredPlugins[pluginName] = true;
        }
      }
    }
    // Register Font styles (versions 3.2.1 and above).
    if (Drupal.settings.wysiwyg.configs.ckeditor[format].stylesSet) {
      CKEDITOR.stylesSet.add(format, Drupal.settings.wysiwyg.configs.ckeditor[format].stylesSet);
    }
  }
};


/**
 * Attach this editor to a target element.
 */
Drupal.wysiwyg.editor.attach.ckeditor = function(context, params, settings) {
  // Apply editor instance settings.
  CKEDITOR.config.customConfig = '';

  var $drupalToolbar = $('#toolbar', Drupal.overlayChild ? window.parent.document : document);

  settings.on = {
    instanceReady: function(ev) {
      var editor = ev.editor;
      // Get a list of block, list and table tags from CKEditor's XHTML DTD.
      // @see http://docs.cksource.com/CKEditor_3.x/Developers_Guide/Output_Formatting.
      var dtd = CKEDITOR.dtd;
      var tags = CKEDITOR.tools.extend({}, dtd.$block, dtd.$listItem, dtd.$tableContent);
      // Set source formatting rules for each listed tag except <pre>.
      // Linebreaks can be inserted before or after opening and closing tags.
      if (settings.apply_source_formatting) {
        // Mimic FCKeditor output, by breaking lines between tags.
        for (var tag in tags) {
          if (tag == 'pre') {
            continue;
          }
          this.dataProcessor.writer.setRules(tag, {
            indent: true,
            breakBeforeOpen: true,
            breakAfterOpen: false,
            breakBeforeClose: false,
            breakAfterClose: true
          });
        }
      }
      else {
        // CKEditor adds default formatting to <br>, so we want to remove that
        // here too.
        tags.br = 1;
        // No indents or linebreaks;
        for (var tag in tags) {
          if (tag == 'pre') {
            continue;
          }
          this.dataProcessor.writer.setRules(tag, {
            indent: false,
            breakBeforeOpen: false,
            breakAfterOpen: false,
            breakBeforeClose: false,
            breakAfterClose: false
          });
        }
      }
    },

    pluginsLoaded: function(ev) {
      // Override the conversion methods to let Drupal plugins modify the data.
      var editor = ev.editor;
      if (editor.dataProcessor && Drupal.settings.wysiwyg.plugins[params.format]) {
        editor.dataProcessor.toHtml = CKEDITOR.tools.override(editor.dataProcessor.toHtml, function(originalToHtml) {
          // Convert raw data for display in WYSIWYG mode.
          return function(data, fixForBody) {
            for (var plugin in Drupal.settings.wysiwyg.plugins[params.format].drupal) {
              if (typeof Drupal.wysiwyg.plugins[plugin].attach == 'function') {
                data = Drupal.wysiwyg.plugins[plugin].attach(data, Drupal.settings.wysiwyg.plugins.drupal[plugin], editor.name);
                data = Drupal.wysiwyg.instances[params.field].prepareContent(data);
              }
            }
            return originalToHtml.call(this, data, fixForBody);
          };
        });
        editor.dataProcessor.toDataFormat = CKEDITOR.tools.override(editor.dataProcessor.toDataFormat, function(originalToDataFormat) {
          // Convert WYSIWYG mode content to raw data.
          return function(data, fixForBody) {
            data = originalToDataFormat.call(this, data, fixForBody);
            for (var plugin in Drupal.settings.wysiwyg.plugins[params.format].drupal) {
              if (typeof Drupal.wysiwyg.plugins[plugin].detach == 'function') {
                data = Drupal.wysiwyg.plugins[plugin].detach(data, Drupal.settings.wysiwyg.plugins.drupal[plugin], editor.name);
              }
            }
            return data;
          };
        });
      }
    },

    selectionChange: function (event) {
      var pluginSettings = Drupal.settings.wysiwyg.plugins[params.format];
      if (pluginSettings && pluginSettings.drupal) {
        $.each(pluginSettings.drupal, function (name) {
          var plugin = Drupal.wysiwyg.plugins[name];
          if ($.isFunction(plugin.isNode)) {
            var node = event.data.selection.getSelectedElement();
            var state = plugin.isNode(node ? node.$ : null) ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF;
            event.editor.getCommand(name).setState(state);
          }
        });
      }
    },

    focus: function(ev) {
      Drupal.wysiwyg.activeId = ev.editor.name;
    },

    afterCommandExec: function(ev) {
      // Fix Drupal toolbar obscuring editor toolbar in fullscreen mode.
      if (ev.data.name != 'maximize') {
        return;
      }
      if (ev.data.command.state == CKEDITOR.TRISTATE_ON) {
        $drupalToolbar.hide();
      }
      else {
        $drupalToolbar.show();
      }
    }
  };

  // Attach editor.
  CKEDITOR.replace(params.field, settings);
};

/**
 * Detach a single or all editors.
 *
 * @todo 3.x: editor.prototype.getInstances() should always return an array
 *   containing all instances or the passed in params.field instance, but
 *   always return an array to simplify all detach functions.
 */
Drupal.wysiwyg.editor.detach.ckeditor = function (context, params, trigger) {
  var method = (trigger == 'serialize') ? 'updateElement' : 'destroy';
  if (typeof params != 'undefined') {
    var instance = CKEDITOR.instances[params.field];
    if (instance) {
      instance[method]();
    }
  }
  else {
    for (var instanceName in CKEDITOR.instances) {
      if (CKEDITOR.instances.hasOwnProperty(instanceName)) {
        CKEDITOR.instances[instanceName][method]();
      }
    }
  }
};

Drupal.wysiwyg.editor.instance.ckeditor = {
  addPlugin: function(pluginName, settings, pluginSettings) {
    CKEDITOR.plugins.add(pluginName, {
      // Wrap Drupal plugin in a proxy pluygin.
      init: function(editor) {
        if (settings.css) {
          editor.on('mode', function(ev) {
            if (ev.editor.mode == 'wysiwyg') {
              // Inject CSS files directly into the editing area head tag.
              $('head', $('#cke_contents_' + ev.editor.name + ' iframe').eq(0).contents()).append('<link rel="stylesheet" href="' + settings.css + '" type="text/css" >');
            }
          });
        }
        if (typeof Drupal.wysiwyg.plugins[pluginName].invoke == 'function') {
          var pluginCommand = {
            exec: function (editor) {
              var data = { format: 'html', node: null, content: '' };
              var selection = editor.getSelection();
              if (selection) {
                data.node = selection.getSelectedElement();
                if (data.node) {
                  data.node = data.node.$;
                }
                if (selection.getType() == CKEDITOR.SELECTION_TEXT) {
                  if (CKEDITOR.env.ie) {
                    data.content = selection.getNative().createRange().text;
                  }
                  else {
                    data.content = selection.getNative().toString();
                  }
                }
                else if (data.node) {
                  // content is supposed to contain the "outerHTML".
                  data.content = data.node.parentNode.innerHTML;
                }
              }
              Drupal.wysiwyg.plugins[pluginName].invoke(data, pluginSettings, editor.name);
            }
          };
          editor.addCommand(pluginName, pluginCommand);
        }
        editor.ui.addButton(pluginName, {
          label: settings.iconTitle,
          command: pluginName,
          icon: settings.icon
        });

        // @todo Add button state handling.
      }
    });
  },
  prepareContent: function(content) {
    // @todo Don't know if we need this yet.
    return content;
  },

  insert: function(content) {
    content = this.prepareContent(content);
    CKEDITOR.instances[this.field].insertHtml(content);
  },

  setContent: function (content) {
    CKEDITOR.instances[this.field].setData(content);
  },

  getContent: function () {
    return CKEDITOR.instances[this.field].getData();
  }
};

})(jQuery);
;
(function($) {

/**
 * Attach this editor to a target element.
 *
 * @param context
 *   A DOM element, supplied by Drupal.attachBehaviors().
 * @param params
 *   An object containing input format parameters. Default parameters are:
 *   - editor: The internal editor name.
 *   - theme: The name/key of the editor theme/profile to use.
 *   - field: The CSS id of the target element.
 * @param settings
 *   An object containing editor settings for all enabled editor themes.
 */
Drupal.wysiwyg.editor.attach.none = function(context, params, settings) {
  if (params.resizable) {
    var $wrapper = $('#' + params.field).parents('.form-textarea-wrapper:first');
    $wrapper.addClass('resizable');
    if (Drupal.behaviors.textarea) {
      Drupal.behaviors.textarea.attach();
    }
  }
};

/**
 * Detach a single or all editors.
 *
 * The editor syncs its contents back to the original field before its instance
 * is removed.
 *
 * @param context
 *   A DOM element, supplied by Drupal.attachBehaviors().
 * @param params
 *   (optional) An object containing input format parameters. If defined,
 *   only the editor instance in params.field should be detached. Otherwise,
 *   all editors should be detached and saved, so they can be submitted in
 *   AJAX/AHAH applications.
 * @param trigger
 *   A string describing why the editor is being detached.
 *   Possible triggers are:
 *   - unload: (default) Another or no editor is about to take its place.
 *   - move: Currently expected to produce the same result as unload.
 *   - serialize: The form is about to be serialized before an AJAX request or
 *     a normal form submission. If possible, perform a quick detach and leave
 *     the editor's GUI elements in place to avoid flashes or scrolling issues.
 * @see Drupal.detachBehaviors
 */
Drupal.wysiwyg.editor.detach.none = function (context, params, trigger) {
  if (typeof params != 'undefined' && (trigger != 'serialize')) {
    var $wrapper = $('#' + params.field).parents('.form-textarea-wrapper:first');
    $wrapper.removeOnce('textarea').removeClass('.resizable-textarea')
      .find('.grippie').remove();
  }
};

/**
 * Instance methods for plain text areas.
 */
Drupal.wysiwyg.editor.instance.none = {
  insert: function(content) {
    var editor = document.getElementById(this.field);

    // IE support.
    if (document.selection) {
      editor.focus();
      var sel = document.selection.createRange();
      sel.text = content;
    }
    // Mozilla/Firefox/Netscape 7+ support.
    else if (editor.selectionStart || editor.selectionStart == '0') {
      var startPos = editor.selectionStart;
      var endPos = editor.selectionEnd;
      editor.value = editor.value.substring(0, startPos) + content + editor.value.substring(endPos, editor.value.length);
    }
    // Fallback, just add to the end of the content.
    else {
      editor.value += content;
    }
  },

  setContent: function (content) {
    $('#' + this.field).val(content);
  },

  getContent: function () {
    return $('#' + this.field).val();
  }
};

})(jQuery);
;

(function($) {
//Global container.
window.imce = {tree: {}, findex: [], fids: {}, selected: {}, selcount: 0, ops: {}, cache: {}, urlId: {},
vars: {previewImages: 1, cache: 1},
hooks: {load: [], list: [], navigate: [], cache: []},

//initiate imce.
initiate: function() {
  imce.conf = Drupal.settings.imce || {};
  if (imce.conf.error != false) return;
  imce.FLW = imce.el('file-list-wrapper'), imce.SBW = imce.el('sub-browse-wrapper');
  imce.NW = imce.el('navigation-wrapper'), imce.BW = imce.el('browse-wrapper');
  imce.PW = imce.el('preview-wrapper'), imce.FW = imce.el('forms-wrapper');
  imce.updateUI();
  imce.prepareMsgs();//process initial status messages
  imce.initiateTree();//build directory tree
  imce.hooks.list.unshift(imce.processRow);//set the default list-hook.
  imce.initiateList();//process file list
  imce.initiateOps();//prepare operation tabs
  imce.refreshOps();
  imce.invoke('load', window);//run functions set by external applications.
},

//process navigation tree
initiateTree: function() {
  $('#navigation-tree li').each(function(i) {
    var a = this.firstChild, txt = a.firstChild;
    txt && (txt.data = imce.decode(txt.data));
    var branch = imce.tree[a.title] = {'a': a, li: this, ul: this.lastChild.tagName == 'UL' ? this.lastChild : null};
    if (a.href) imce.dirClickable(branch);
    imce.dirCollapsible(branch);
  });
},

//Add a dir to the tree under parent
dirAdd: function(dir, parent, clickable) {
  if (imce.tree[dir]) return clickable ? imce.dirClickable(imce.tree[dir]) : imce.tree[dir];
  var parent = parent || imce.tree['.'];
  parent.ul = parent.ul ? parent.ul : parent.li.appendChild(imce.newEl('ul'));
  var branch = imce.dirCreate(dir, imce.decode(dir.substr(dir.lastIndexOf('/')+1)), clickable);
  parent.ul.appendChild(branch.li);
  return branch;
},

//create list item for navigation tree
dirCreate: function(dir, text, clickable) {
  if (imce.tree[dir]) return imce.tree[dir];
  var branch = imce.tree[dir] = {li: imce.newEl('li'), a: imce.newEl('a')};
  $(branch.a).addClass('folder').text(text).attr('title', dir).appendTo(branch.li);
  imce.dirCollapsible(branch);
  return clickable ? imce.dirClickable(branch) : branch;
},

//change currently active directory
dirActivate: function(dir) {
  if (dir != imce.conf.dir) {
    if (imce.tree[imce.conf.dir]){
      $(imce.tree[imce.conf.dir].a).removeClass('active');
    }
    $(imce.tree[dir].a).addClass('active');
    imce.conf.dir = dir;
  }
  return imce.tree[imce.conf.dir];
},

//make a dir accessible
dirClickable: function(branch) {
  if (branch.clkbl) return branch;
  $(branch.a).attr('href', '#').removeClass('disabled').click(function() {imce.navigate(this.title); return false;});
  branch.clkbl = true;
  return branch;
},

//sub-directories expand-collapse ability
dirCollapsible: function (branch) {
  if (branch.clpsbl) return branch;
  $(imce.newEl('span')).addClass('expander').html('&nbsp;').click(function() {
    if (branch.ul) {
      $(branch.ul).toggle();
      $(branch.li).toggleClass('expanded');
      $.browser.msie && $('#navigation-header').css('top', imce.NW.scrollTop);
    }
    else if (branch.clkbl){
      $(branch.a).click();
    }
  }).prependTo(branch.li);
  branch.clpsbl = true;
  return branch;
},

//update navigation tree after getting subdirectories.
dirSubdirs: function(dir, subdirs) {
  var branch = imce.tree[dir];
  if (subdirs && subdirs.length) {
    var prefix = dir == '.' ? '' : dir +'/';
    for (var i in subdirs) {//add subdirectories
      imce.dirAdd(prefix + subdirs[i], branch, true);
    }
    $(branch.li).removeClass('leaf').addClass('expanded');
    $(branch.ul).show();
  }
  else if (!branch.ul){//no subdirs->leaf
    $(branch.li).removeClass('expanded').addClass('leaf');
  }
},

//process file list
initiateList: function(cached) {
  var L = imce.hooks.list, dir = imce.conf.dir, token = {'%dir':  dir == '.' ? $(imce.tree['.'].a).text() : imce.decode(dir)}
  imce.findex = [], imce.fids = {}, imce.selected = {}, imce.selcount = 0, imce.vars.lastfid = null;
  imce.tbody = imce.el('file-list').tBodies[0];
  if (imce.tbody.rows.length) {
    for (var row, i = 0; row = imce.tbody.rows[i]; i++) {
      var fid = row.id;
      imce.findex[i] = imce.fids[fid] = row;
      if (cached) {
        if (imce.hasC(row, 'selected')) {
          imce.selected[imce.vars.lastfid = fid] = row;
          imce.selcount++;
        }
      }
      else {
        for (var func, j = 0; func = L[j]; j++) func(row);//invoke list-hook
      }
    }
  }
  if (!imce.conf.perm.browse) {
    imce.setMessage(Drupal.t('File browsing is disabled in directory %dir.', token), 'error');
  }
},

//add a file to the list. (having properties name,size,formatted size,width,height,date,formatted date)
fileAdd: function(file) {
  var row, fid = file.name, i = imce.findex.length, attr = ['name', 'size', 'width', 'height', 'date'];
  if (!(row = imce.fids[fid])) {
    row = imce.findex[i] = imce.fids[fid] = imce.tbody.insertRow(i);
    for (var i in attr) row.insertCell(i).className = attr[i];
  }
  row.cells[0].innerHTML = row.id = fid;
  row.cells[1].innerHTML = file.fsize; row.cells[1].id = file.size;
  row.cells[2].innerHTML = file.width;
  row.cells[3].innerHTML = file.height;
  row.cells[4].innerHTML = file.fdate; row.cells[4].id = file.date;
  imce.invoke('list', row);
  if (imce.vars.prvfid == fid) imce.setPreview(fid);
  if (file.id) imce.urlId[imce.getURL(fid)] = file.id;
},

//remove a file from the list
fileRemove: function(fid) {
  if (!(row = imce.fids[fid])) return;
  imce.fileDeSelect(fid);
  imce.findex.splice(row.rowIndex, 1);
  $(row).remove();
  delete imce.fids[fid];
  if (imce.vars.prvfid == fid) imce.setPreview();
},

//return a file object containing all properties.
fileGet: function (fid) {
  var row = imce.fids[fid];
  var url = imce.getURL(fid);
  return row ? {
    name: imce.decode(fid),
    url: url,
    size: row.cells[1].innerHTML,
    bytes: row.cells[1].id * 1,
    width: row.cells[2].innerHTML * 1,
    height: row.cells[3].innerHTML * 1,
    date: row.cells[4].innerHTML,
    time: row.cells[4].id * 1,
    id: imce.urlId[url] || 0, //file id for newly uploaded files
    relpath: (imce.conf.dir == '.' ? '' : imce.conf.dir +'/') + fid //rawurlencoded path relative to file directory path.
  } : null;
},

//simulate row click. selection-highlighting
fileClick: function(row, ctrl, shft) {
  if (!row) return;
  var fid = typeof(row) == 'string' ? row : row.id;
  if (ctrl || fid == imce.vars.prvfid) {
    imce.fileToggleSelect(fid);
  }
  else if (shft) {
    var last = imce.lastFid();
    var start = last ? imce.fids[last].rowIndex : -1;
    var end = imce.fids[fid].rowIndex;
    var step = start > end ? -1 : 1;
    while (start != end) {
      start += step;
      imce.fileSelect(imce.findex[start].id);
    }
  }
  else {
    for (var fname in imce.selected) {
      imce.fileDeSelect(fname);
    }
    imce.fileSelect(fid);
  }
  //set preview
  imce.setPreview(imce.selcount == 1 ? imce.lastFid() : null);
},

//file select/deselect functions
fileSelect: function (fid) {
  if (imce.selected[fid] || !imce.fids[fid]) return;
  imce.selected[fid] = imce.fids[imce.vars.lastfid=fid];
  $(imce.selected[fid]).addClass('selected');
  imce.selcount++;
},
fileDeSelect: function (fid) {
  if (!imce.selected[fid] || !imce.fids[fid]) return;
  if (imce.vars.lastfid == fid) imce.vars.lastfid = null;
  $(imce.selected[fid]).removeClass('selected');
  delete imce.selected[fid];
  imce.selcount--;
},
fileToggleSelect: function (fid) {
  imce['file'+ (imce.selected[fid] ? 'De' : '') +'Select'](fid);
},

//process file operation form and create operation tabs.
initiateOps: function() {
  imce.setHtmlOps();
  imce.setUploadOp();//upload
  imce.setFileOps();//thumb, delete, resize
},

//process existing html ops.
setHtmlOps: function () {
  $(imce.el('ops-list')).children('li').each(function() {
    if (!this.firstChild) return $(this).remove();
    var name = this.id.substr(8);
    var Op = imce.ops[name] = {div: imce.el('op-content-'+ name), li: imce.el('op-item-'+ name)};
    Op.a = Op.li.firstChild;
    Op.title = Op.a.innerHTML;
    $(Op.a).click(function() {imce.opClick(name); return false;});
  });
},

//convert upload form to an op.
setUploadOp: function () {
  var form = imce.el('imce-upload-form');
  if (!form) return;
  $(form).ajaxForm(imce.uploadSettings()).find('fieldset').each(function() {//clean up fieldsets
    this.removeChild(this.firstChild);
    $(this).after(this.childNodes);
  }).remove();
  imce.opAdd({name: 'upload', title: Drupal.t('Upload'), content: form});//add op
},

//convert fileop form submit buttons to ops.
setFileOps: function () {
  var form = imce.el('imce-fileop-form');
  if (!form) return;
  $(form.elements.filenames).parent().remove();
  $(form).find('fieldset').each(function() {//remove fieldsets
    var $sbmt = $('input:submit', this);
    if (!$sbmt.size()) return;
    var Op = {name: $sbmt.attr('id').substr(5)};
    var func = function() {imce.fopSubmit(Op.name); return false;};
    $sbmt.click(func);
    Op.title = $(this).children('legend').remove().text() || $sbmt.val();
    Op.name == 'delete' ? (Op.func = func) : (Op.content = this.childNodes);
    imce.opAdd(Op);
  }).remove();
  imce.vars.opform = $(form).serialize();//serialize remaining parts.
},

//refresh ops states. enable/disable
refreshOps: function() {
  for (var p in imce.conf.perm) {
    if (imce.conf.perm[p]) imce.opEnable(p);
    else imce.opDisable(p);
  }
},

//add a new file operation
opAdd: function (op) {
  var oplist = imce.el('ops-list'), opcons = imce.el('op-contents');
  var name = op.name || ('op-'+ $(oplist).children('li').size());
  var title = op.title || 'Untitled';
  var Op = imce.ops[name] = {title: title};
  if (op.content) {
    Op.div = imce.newEl('div');
    $(Op.div).attr({id: 'op-content-'+ name, 'class': 'op-content'}).appendTo(opcons).append(op.content);
  }
  Op.a = imce.newEl('a');
  Op.li = imce.newEl('li');
  $(Op.a).attr({href: '#', name: name, title: title}).html('<span>' + title +'</span>').click(imce.opClickEvent);
  $(Op.li).attr('id', 'op-item-'+ name).append(Op.a).appendTo(oplist);
  Op.func = op.func || imce.opVoid;
  return Op;
},

//click event for file operations
opClickEvent: function(e) {
  imce.opClick(this.name);
  return false;
},

//void operation function
opVoid: function() {},

//perform op click
opClick: function(name) {
  var Op = imce.ops[name], oldop = imce.vars.op;
  if (!Op || Op.disabled) {
    return imce.setMessage(Drupal.t('You can not perform this operation.'), 'error');
  }
  if (Op.div) {
    if (oldop) {
      var toggle = oldop == name;
      imce.opShrink(oldop, toggle ? 'fadeOut' : 'hide');
      if (toggle) return false;
    }
    var left = Op.li.offsetLeft;
    var $opcon = $('#op-contents').css({left: 0});
    $(Op.div).fadeIn('normal', function() {
      setTimeout(function() {
        if (imce.vars.op) {
          var $inputs = $('input', imce.ops[imce.vars.op].div);
          $inputs.eq(0).focus();
          //form inputs become invisible in IE. Solution is as stupid as the behavior.
          $('html').is('.ie') && $inputs.addClass('dummyie').removeClass('dummyie');
       }
      });
    });
    var diff = left + $opcon.width() - $('#imce-content').width();
    $opcon.css({left: diff > 0 ? left - diff - 1 : left});
    $(Op.li).addClass('active');
    $(imce.opCloseLink).fadeIn(300);
    imce.vars.op = name;
  }
  Op.func(true);
  return true;
},

//enable a file operation
opEnable: function(name) {
  var Op = imce.ops[name];
  if (Op && Op.disabled) {
    Op.disabled = false;
    $(Op.li).show();
  }
},

//disable a file operation
opDisable: function(name) {
  var Op = imce.ops[name];
  if (Op && !Op.disabled) {
    Op.div && imce.opShrink(name);
    $(Op.li).hide();
    Op.disabled = true;
  }
},

//hide contents of a file operation
opShrink: function(name, effect) {
  if (imce.vars.op != name) return;
  var Op = imce.ops[name];
  $(Op.div).stop(true, true)[effect || 'hide']();
  $(Op.li).removeClass('active');
  $(imce.opCloseLink).hide();
  Op.func(false);
  imce.vars.op = null;
},

//navigate to dir
navigate: function(dir) {
  if (imce.vars.navbusy || (dir == imce.conf.dir && !confirm(Drupal.t('Do you want to refresh the current directory?')))) return;
  var cache = imce.vars.cache && dir != imce.conf.dir;
  var set = imce.navSet(dir, cache);
  if (cache && imce.cache[dir]) {//load from the cache
    set.success({data: imce.cache[dir]});
    set.complete();
  }
  else $.ajax(set);//live load
},
//ajax navigation settings
navSet: function (dir, cache) {
  $(imce.tree[dir].li).addClass('loading');
  imce.vars.navbusy = dir;
  return {url: imce.ajaxURL('navigate', dir),
  type: 'GET',
  dataType: 'json',
  success: function(response) {
    if (response.data && !response.data.error) {
      if (cache) imce.navCache(imce.conf.dir, dir);//cache the current dir
      imce.navUpdate(response.data, dir);
    }
    imce.processResponse(response);
  },
  complete: function () {
    $(imce.tree[dir].li).removeClass('loading');
    imce.vars.navbusy = null;
  }
  };
},

//update directory using the given data
navUpdate: function(data, dir) {
  var cached = data == imce.cache[dir], olddir = imce.conf.dir;
  if (cached) data.files.id = 'file-list';
  $(imce.FLW).html(data.files);
  imce.dirActivate(dir);
  imce.dirSubdirs(dir, data.subdirectories);
  $.extend(imce.conf.perm, data.perm);
  imce.refreshOps();
  imce.initiateList(cached);
  imce.setPreview(imce.selcount == 1 ? imce.lastFid() : null);
  imce.SBW.scrollTop = 0;
  imce.invoke('navigate', data, olddir, cached);
},

//set cache
navCache: function (dir, newdir) {
  var C = imce.cache[dir] = {'dir': dir, files: imce.el('file-list'), dirsize: imce.el('dir-size').innerHTML, perm: $.extend({}, imce.conf.perm)};
  C.files.id = 'cached-list-'+ dir;
  imce.FW.appendChild(C.files);
  imce.invoke('cache', C, newdir);
},

//validate upload form
uploadValidate: function (data, form, options) {
  var path = $('#edit-imce').val();
  if (!path) return false;
  if (imce.conf.extensions != '*') {
    var ext = path.substr(path.lastIndexOf('.') + 1);
    if ((' '+ imce.conf.extensions +' ').indexOf(' '+ ext.toLowerCase() +' ') == -1) {
      return imce.setMessage(Drupal.t('Only files with the following extensions are allowed: %files-allowed.', {'%files-allowed': imce.conf.extensions}), 'error');
    }
  }
  var sep = path.indexOf('/') == -1 ? '\\' : '/';
  options.url = imce.ajaxURL('upload');//make url contain current dir.
  imce.fopLoading('upload', true);
  return true;
},

//settings for upload
uploadSettings: function () {
  return {beforeSubmit: imce.uploadValidate, success: function (response) {imce.processResponse($.parseJSON(response));}, complete: function () {imce.fopLoading('upload', false);}, resetForm: true};
},

//validate default ops(delete, thumb, resize)
fopValidate: function(fop) {
  if (!imce.validateSelCount(1, imce.conf.filenum)) return false;
  switch (fop) {
    case 'delete':
      return confirm(Drupal.t('Delete selected files?'));
    case 'thumb':
      if (!$('input:checked', imce.ops['thumb'].div).size()) {
        return imce.setMessage(Drupal.t('Please select a thumbnail.'), 'error');
      }
      return imce.validateImage();
    case 'resize':
      var w = imce.el('edit-width').value, h = imce.el('edit-height').value;
      var maxDim = imce.conf.dimensions.split('x');
      var maxW = maxDim[0]*1, maxH = maxW ? maxDim[1]*1 : 0;
      if (!(/^[1-9][0-9]*$/).test(w) || !(/^[1-9][0-9]*$/).test(h) || (maxW && (maxW < w*1 || maxH < h*1))) {
        return imce.setMessage(Drupal.t('Please specify dimensions within the allowed range that is from 1x1 to @dimensions.', {'@dimensions': maxW ? imce.conf.dimensions : Drupal.t('unlimited')}), 'error');
      }
      return imce.validateImage();
  }

  var func = fop +'OpValidate';
  if (imce[func]) return imce[func](fop);
  return true;
},

//submit wrapper for default ops
fopSubmit: function(fop) {
  switch (fop) {
    case 'thumb': case 'delete': case 'resize':  return imce.commonSubmit(fop);
  }
  var func = fop +'OpSubmit';
  if (imce[func]) return imce[func](fop);
},

//common submit function shared by default ops
commonSubmit: function(fop) {
  if (!imce.fopValidate(fop)) return false;
  imce.fopLoading(fop, true);
  $.ajax(imce.fopSettings(fop));
},

//settings for default file operations
fopSettings: function (fop) {
  return {url: imce.ajaxURL(fop), type: 'POST', dataType: 'json', success: imce.processResponse, complete: function (response) {imce.fopLoading(fop, false);}, data: imce.vars.opform +'&filenames='+ imce.serialNames() +'&jsop='+ fop + (imce.ops[fop].div ? '&'+ $('input, select, textarea', imce.ops[fop].div).serialize() : '')};
},

//toggle loading state
fopLoading: function(fop, state) {
  var el = imce.el('edit-'+ fop), func = state ? 'addClass' : 'removeClass';
  if (el) {
    $(el)[func]('loading').attr('disabled', state);
  }
  else {
    $(imce.ops[fop].li)[func]('loading');
    imce.ops[fop].disabled = state;
  }
},

//preview a file.
setPreview: function (fid) {
  var row, html = '';
  imce.vars.prvfid = fid;
  if (fid && (row = imce.fids[fid])) {
    var width = row.cells[2].innerHTML * 1;
    html = imce.vars.previewImages && width ? imce.imgHtml(fid, width, row.cells[3].innerHTML) : imce.decodePlain(fid);
    html = '<a href="#" onclick="imce.send(\''+ fid +'\'); return false;" title="'+ (imce.vars.prvtitle||'') +'">'+ html +'</a>';
  }
  imce.el('file-preview').innerHTML = html;
},

//default file send function. sends the file to the new window.
send: function (fid) {
  fid && window.open(imce.getURL(fid));
},

//add an operation for an external application to which the files are send.
setSendTo: function (title, func) {
  imce.send = function (fid) { fid && func(imce.fileGet(fid), window);};
  var opFunc = function () {
    if (imce.selcount != 1) return imce.setMessage(Drupal.t('Please select a file.'), 'error');
    imce.send(imce.vars.prvfid);
  };
  imce.vars.prvtitle = title;
  return imce.opAdd({name: 'sendto', title: title, func: opFunc});
},

//move initial page messages into log
prepareMsgs: function () {
  var msgs;
  if (msgs = imce.el('imce-messages')) {
    $('>div', msgs).each(function (){
      var type = this.className.split(' ')[1];
      var li = $('>ul li', this);
      if (li.size()) li.each(function () {imce.setMessage(this.innerHTML, type);});
      else imce.setMessage(this.innerHTML, type);
    });
    $(msgs).remove();
  }
},

//insert log message
setMessage: function (msg, type) {
  var $box = $(imce.msgBox);
  var logs = imce.el('log-messages') || $(imce.newEl('div')).appendTo('#help-box-content').before('<h4>'+ Drupal.t('Log messages') +':</h4>').attr('id', 'log-messages')[0];
  var msg = '<div class="message '+ (type || 'status') +'">'+ msg +'</div>';
  $box.queue(function() {
    $box.css({opacity: 0, display: 'block'}).html(msg);
    $box.dequeue();
  });
  var q = $box.queue().length, t = imce.vars.msgT || 1000;
  q = q < 2 ? 1 : q < 3 ? 0.8 : q < 4 ? 0.7 : 0.4;//adjust speed with respect to queue length
  $box.fadeTo(600 * q, 1).fadeTo(t * q, 1).fadeOut(400 * q);
  $(logs).append(msg);
  return false;
},

//invoke hooks
invoke: function (hook) {
  var i, args, func, funcs;
  if ((funcs = imce.hooks[hook]) && funcs.length) {
    (args = $.makeArray(arguments)).shift();
    for (i = 0; func = funcs[i]; i++) func.apply(this, args);
  }
},

//process response
processResponse: function (response) {
  if (response.data) imce.resData(response.data);
  if (response.messages) imce.resMsgs(response.messages);
},

//process response data
resData: function (data) {
  var i, added, removed;
  if (added = data.added) {
    var cnt = imce.findex.length;
    for (i in added) {//add new files or update existing
      imce.fileAdd(added[i]);
    }
    if (added.length == 1) {//if it is a single file operation
      imce.highlight(added[0].name);//highlight
    }
    if (imce.findex.length != cnt) {//if new files added, scroll to bottom.
      $(imce.SBW).animate({scrollTop: imce.SBW.scrollHeight}).focus();
    }
  }
  if (removed = data.removed) for (i in removed) {
    imce.fileRemove(removed[i]);
  }
  imce.conf.dirsize = data.dirsize;
  imce.updateStat();
},

//set response messages
resMsgs: function (msgs) {
  for (var type in msgs) for (var i in msgs[type]) {
    imce.setMessage(msgs[type][i], type);
  }
},

//return img markup
imgHtml: function (fid, width, height) {
  return '<img src="'+ imce.getURL(fid) +'" width="'+ width +'" height="'+ height +'" alt="'+ imce.decodePlain(fid) +'">';
},

//check if the file is an image
isImage: function (fid) {
  return imce.fids[fid].cells[2].innerHTML * 1;
},

//find the first non-image in the selection
getNonImage: function (selected) {
  for (var fid in selected) {
    if (!imce.isImage(fid)) return fid;
  }
  return false;
},

//validate current selection for images
validateImage: function () {
  var nonImg = imce.getNonImage(imce.selected);
  return nonImg ? imce.setMessage(Drupal.t('%filename is not an image.', {'%filename': imce.decode(nonImg)}), 'error') : true;
},

//validate number of selected files
validateSelCount: function (Min, Max) {
  if (Min && imce.selcount < Min) {
    return imce.setMessage(Min == 1 ? Drupal.t('Please select a file.') : Drupal.t('You must select at least %num files.', {'%num': Min}), 'error');
  }
  if (Max && Max < imce.selcount) {
    return imce.setMessage(Drupal.t('You are not allowed to operate on more than %num files.', {'%num': Max}), 'error');
  }
  return true;
},

//update file count and dir size
updateStat: function () {
  imce.el('file-count').innerHTML = imce.findex.length;
  imce.el('dir-size').innerHTML = imce.conf.dirsize;
},

//serialize selected files. return fids with a colon between them
serialNames: function () {
  var str = '';
  for (var fid in imce.selected) {
    str += ':'+ fid;
  }
  return str.substr(1);
},

//get file url. re-encode & and # for mod rewrite
getURL: function (fid) {
  var path = (imce.conf.dir == '.' ? '' : imce.conf.dir +'/') + fid;
  return imce.conf.furl + (imce.conf.modfix ? path.replace(/%(23|26)/g, '%25$1') : path);
},

//el. by id
el: function (id) {
  return document.getElementById(id);
},

//find the latest selected fid
lastFid: function () {
  if (imce.vars.lastfid) return imce.vars.lastfid;
  for (var fid in imce.selected);
  return fid;
},

//create ajax url
ajaxURL: function (op, dir) {
  return imce.conf.url + (imce.conf.clean ? '?' :'&') +'jsop='+ op +'&dir='+ (dir||imce.conf.dir);
},

//fast class check
hasC: function (el, name) {
  return el.className && (' '+ el.className +' ').indexOf(' '+ name +' ') != -1;
},

//highlight a single file
highlight: function (fid) {
  if (imce.vars.prvfid) imce.fileClick(imce.vars.prvfid);
  imce.fileClick(fid);
},

//process a row
processRow: function (row) {
  row.cells[0].innerHTML = '<span>' + imce.decodePlain(row.id) + '</span>';
  row.onmousedown = function(e) {
    var e = e||window.event;
    imce.fileClick(this, e.ctrlKey, e.shiftKey);
    return !(e.ctrlKey || e.shiftKey);
  };
  row.ondblclick = function(e) {
    imce.send(this.id);
    return false;
  };
},

//decode urls. uses unescape. can be overridden to use decodeURIComponent
decode: function (str) {
  return unescape(str);
},

//decode and convert to plain text
decodePlain: function (str) {
  return Drupal.checkPlain(imce.decode(str));
},

//global ajax error function
ajaxError: function (e, response, settings, thrown) {
  imce.setMessage(Drupal.ajaxError(response, settings.url).replace(/\n/g, '<br />'), 'error');
},

//convert button elements to standard input buttons
convertButtons: function(form) {
  $('button:submit', form).each(function(){
    $(this).replaceWith('<input type="submit" value="'+ $(this).text() +'" name="'+ this.name +'" class="form-submit" id="'+ this.id +'" />');
  });
},

//create element
newEl: function(name) {
  return document.createElement(name);
},

//scroll syncronization for section headers
syncScroll: function(scrlEl, fixEl, bottom) {
  var $fixEl = $(fixEl);
  var prop = bottom ? 'bottom' : 'top';
  var factor = bottom ? -1 : 1;
  var syncScrl = function(el) {
    $fixEl.css(prop, factor * el.scrollTop);
  }
  $(scrlEl).scroll(function() {
    var el = this;
    syncScrl(el);
    setTimeout(function() {
      syncScrl(el);
    });
  });
},

//get UI ready. provide backward compatibility.
updateUI: function() {
  //file urls.
  var furl = imce.conf.furl, isabs = furl.indexOf('://') > -1;
  var absurls = imce.conf.absurls = imce.vars.absurls || imce.conf.absurls;
  var host = location.host;
  var baseurl = location.protocol + '//' + host;
  if (furl.charAt(furl.length - 1) != '/') {
    furl = imce.conf.furl = furl + '/';
  }
  imce.conf.modfix = imce.conf.clean && furl.indexOf(host + '/system/') > -1;
  if (absurls && !isabs) {
    imce.conf.furl = baseurl + furl;
  }
  else if (!absurls && isabs && furl.indexOf(baseurl) == 0) {
    imce.conf.furl = furl.substr(baseurl.length);
  }
  //convert button elements to input elements.
  imce.convertButtons(imce.FW);
  //ops-list
  $('#ops-list').removeClass('tabs secondary').addClass('clear-block clearfix');
  imce.opCloseLink = $(imce.newEl('a')).attr({id: 'op-close-link', href: '#', title: Drupal.t('Close')}).click(function() {
    imce.vars.op && imce.opClick(imce.vars.op);
    return false;
  }).appendTo('#op-contents')[0];
  //navigation-header
  if (!$('#navigation-header').size()) {
    $(imce.NW).children('.navigation-text').attr('id', 'navigation-header').wrapInner('<span></span>');
  }
  //log
  $('#log-prv-wrapper').before($('#log-prv-wrapper > #preview-wrapper')).remove();
  $('#log-clearer').remove();
  //content resizer
  $('#content-resizer').remove();
  //message-box
  imce.msgBox = imce.el('message-box') || $(imce.newEl('div')).attr('id', 'message-box').prependTo('#imce-content')[0];
  //create help tab
  var $hbox = $('#help-box');
  $hbox.is('a') && $hbox.replaceWith($(imce.newEl('div')).attr('id', 'help-box').append($hbox.children()));
  imce.hooks.load.push(function() {
    imce.opAdd({name: 'help', title: $('#help-box-title').remove().text(), content: $('#help-box').show()});
  });
  //add ie classes
  $.browser.msie && $('html').addClass('ie') && parseFloat($.browser.version) < 8 && $('html').addClass('ie-7');
  // enable box view for file list
  imce.vars.boxW && imce.boxView();
  //scrolling file list
  imce.syncScroll(imce.SBW, '#file-header-wrapper');
  imce.syncScroll(imce.SBW, '#dir-stat', true);
  //scrolling directory tree
  imce.syncScroll(imce.NW, '#navigation-header');
}

};

//initiate
$(document).ready(imce.initiate).ajaxError(imce.ajaxError);

})(jQuery);;
/*
 * IMCE Integration by URL
 * Ex-1: http://example.com/imce?app=XEditor|url@urlFieldId|width@widthFieldId|height@heightFieldId
 * Creates "Insert file" operation tab, which fills the specified fields with url, width, height properties
 * of the selected file in the parent window
 * Ex-2: http://example.com/imce?app=XEditor|sendto@functionName
 * "Insert file" operation calls parent window's functionName(file, imceWindow)
 * Ex-3: http://example.com/imce?app=XEditor|imceload@functionName
 * Parent window's functionName(imceWindow) is called as soon as IMCE UI is ready. Send to operation
 * needs to be set manually. See imce.setSendTo() method in imce.js
 */

(function($) {

var appFields = {}, appWindow = (top.appiFrm||window).opener || parent;

// Execute when imce loads.
imce.hooks.load.push(function(win) {
  var index = location.href.lastIndexOf('app=');
  if (index == -1) return;
  var data = decodeURIComponent(location.href.substr(index + 4)).split('|');
  var arr, prop, str, func, appName = data.shift();
  // Extract fields
  for (var i = 0, len = data.length; i < len; i++) {
    str = data[i];
    if (!str.length) continue;
    if (str.indexOf('&') != -1) str = str.split('&')[0];
    arr = str.split('@');
    if (arr.length > 1) {
      prop = arr.shift();
      appFields[prop] = arr.join('@');
    }
  }
  // Run custom onload function if available
  if (appFields.imceload && (func = isFunc(appFields.imceload))) {
    func(win);
    delete appFields.imceload;
  }
  // Set custom sendto function. appFinish is the default.
  var sendtoFunc = appFields.url ? appFinish : false;
  //check sendto@funcName syntax in URL
  if (appFields.sendto && (func = isFunc(appFields.sendto))) {
    sendtoFunc = func;
    delete appFields.sendto;
  }
  // Check old method windowname+ImceFinish.
  else if (win.name && (func = isFunc(win.name +'ImceFinish'))) {
    sendtoFunc = func;
  }
  // Highlight file
  if (appFields.url) {
    // Support multiple url fields url@field1,field2..
    if (appFields.url.indexOf(',') > -1) {
      var arr = appFields.url.split(',');
      for (var i in arr) {
        if ($('#'+ arr[i], appWindow.document).size()) {
          appFields.url = arr[i];
          break;
        }
      }
    }
    var filename = $('#'+ appFields.url, appWindow.document).val() || '';
    imce.highlight(filename.substr(filename.lastIndexOf('/')+1));
  }
  // Set send to
  sendtoFunc && imce.setSendTo(Drupal.t('Insert file'), sendtoFunc);
});

// Default sendTo function
var appFinish = function(file, win) {
  var $doc = $(appWindow.document);
  for (var i in appFields) {
    $doc.find('#'+ appFields[i]).val(file[i]);
  }
  if (appFields.url) {
    try{
      $doc.find('#'+ appFields.url).blur().change().focus();
    }catch(e){
      try{
        $doc.find('#'+ appFields.url).trigger('onblur').trigger('onchange').trigger('onfocus');//inline events for IE
      }catch(e){}
    }
  }
  appWindow.focus();
  win.close();
};

// Checks if a string is a function name in the given scope.
// Returns function reference. Supports x.y.z notation.
var isFunc = function(str, scope) {
  var obj = scope || appWindow;
  var parts = str.split('.'), len = parts.length;
  for (var i = 0; i < len && (obj = obj[parts[i]]); i++);
  return obj && i == len && (typeof obj == 'function' || typeof obj != 'string' && !obj.nodeName && obj.constructor != Array && /^[\s[]?function/.test(obj.toString())) ? obj : false;
}

})(jQuery);;

/**
 * Wysiwyg API integration helper function.
 */
function imceImageBrowser(field_name, url, type, win) {
  // TinyMCE.
  if (win !== 'undefined') {
    win.open(Drupal.settings.imce.url + encodeURIComponent(field_name), '', 'width=760,height=560,resizable=1');
  }
}

/**
 * CKeditor integration.
 */
var imceCkeditSendTo = function (file, win) {
  var parts = /\?(?:.*&)?CKEditorFuncNum=(\d+)(?:&|$)/.exec(win.location.href);
  if (parts && parts.length > 1) {
    CKEDITOR.tools.callFunction(parts[1], file.url);
    win.close();
  }
  else {
    throw 'CKEditorFuncNum parameter not found or invalid: ' + win.location.href;
  }
};
;

(function ($) {

/**
 * Auto-hide summary textarea if empty and show hide and unhide links.
 */
Drupal.behaviors.textSummary = {
  attach: function (context, settings) {
    $('.text-summary', context).once('text-summary', function () {
      var $widget = $(this).closest('div.field-type-text-with-summary');
      var $summaries = $widget.find('div.text-summary-wrapper');

      $summaries.once('text-summary-wrapper').each(function(index) {
        var $summary = $(this);
        var $summaryLabel = $summary.find('label');
        var $full = $widget.find('.text-full').eq(index).closest('.form-item');
        var $fullLabel = $full.find('label');

        // Create a placeholder label when the field cardinality is
        // unlimited or greater than 1.
        if ($fullLabel.length == 0) {
          $fullLabel = $('<label></label>').prependTo($full);
        }

        // Setup the edit/hide summary link.
        var $link = $('<span class="field-edit-link">(<a class="link-edit-summary" href="#">' + Drupal.t('Hide summary') + '</a>)</span>').toggle(
          function () {
            $summary.hide();
            $(this).find('a').html(Drupal.t('Edit summary')).end().appendTo($fullLabel);
            return false;
          },
          function () {
            $summary.show();
            $(this).find('a').html(Drupal.t('Hide summary')).end().appendTo($summaryLabel);
            return false;
          }
        ).appendTo($summaryLabel);

        // If no summary is set, hide the summary field.
        if ($(this).find('.text-summary').val() == '') {
          $link.click();
        }
        return;
      });
    });
  }
};

})(jQuery);
;
(function ($) {

/**
 * A progressbar object. Initialized with the given id. Must be inserted into
 * the DOM afterwards through progressBar.element.
 *
 * method is the function which will perform the HTTP request to get the
 * progress bar state. Either "GET" or "POST".
 *
 * e.g. pb = new progressBar('myProgressBar');
 *      some_element.appendChild(pb.element);
 */
Drupal.progressBar = function (id, updateCallback, method, errorCallback) {
  var pb = this;
  this.id = id;
  this.method = method || 'GET';
  this.updateCallback = updateCallback;
  this.errorCallback = errorCallback;

  // The WAI-ARIA setting aria-live="polite" will announce changes after users
  // have completed their current activity and not interrupt the screen reader.
  this.element = $('<div class="progress" aria-live="polite"></div>').attr('id', id);
  this.element.html('<div class="bar"><div class="filled"></div></div>' +
                    '<div class="percentage"></div>' +
                    '<div class="message">&nbsp;</div>');
};

/**
 * Set the percentage and status message for the progressbar.
 */
Drupal.progressBar.prototype.setProgress = function (percentage, message) {
  if (percentage >= 0 && percentage <= 100) {
    $('div.filled', this.element).css('width', percentage + '%');
    $('div.percentage', this.element).html(percentage + '%');
  }
  $('div.message', this.element).html(message);
  if (this.updateCallback) {
    this.updateCallback(percentage, message, this);
  }
};

/**
 * Start monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.startMonitoring = function (uri, delay) {
  this.delay = delay;
  this.uri = uri;
  this.sendPing();
};

/**
 * Stop monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.stopMonitoring = function () {
  clearTimeout(this.timer);
  // This allows monitoring to be stopped from within the callback.
  this.uri = null;
};

/**
 * Request progress data from server.
 */
Drupal.progressBar.prototype.sendPing = function () {
  if (this.timer) {
    clearTimeout(this.timer);
  }
  if (this.uri) {
    var pb = this;
    // When doing a post request, you need non-null data. Otherwise a
    // HTTP 411 or HTTP 406 (with Apache mod_security) error may result.
    $.ajax({
      type: this.method,
      url: this.uri,
      data: '',
      dataType: 'json',
      success: function (progress) {
        // Display errors.
        if (progress.status == 0) {
          pb.displayError(progress.data);
          return;
        }
        // Update display.
        pb.setProgress(progress.percentage, progress.message);
        // Schedule next timer.
        pb.timer = setTimeout(function () { pb.sendPing(); }, pb.delay);
      },
      error: function (xmlhttp) {
        pb.displayError(Drupal.ajaxError(xmlhttp, pb.uri));
      }
    });
  }
};

/**
 * Display errors on the page.
 */
Drupal.progressBar.prototype.displayError = function (string) {
  var error = $('<div class="messages error"></div>').html(string);
  $(this.element).before(error).hide();

  if (this.errorCallback) {
    this.errorCallback(this);
  }
};

})(jQuery);
;
var ManualCrop = {croptool: null, oldSelection: null, widget: null, output: null};

(function ($) {

/**
 * Mark required image styles and trigger the onchange event of all (hidden) fields that store
 * crop data. This way all css classes for the crop lists/buttons will be updated and the default
 * image preview will be changed to the cropped image.
 */
ManualCrop.init = function() {
  var fields = Drupal.settings.manualCrop.fields;

  for (var identifier in fields) {
    for (var k in fields[identifier].required) {
      $('.manualcrop-identifier-' + identifier + ' option[value="' + fields[identifier].required[k] + '"]')
        .addClass('manualcrop-style-required');
    }
  }

  $('.manualcrop-cropdata').trigger('change');
}

/**
 * Callback triggerd after an image upload.
 *
 * @param context
 *    Container of the uploaded image widget.
 */
ManualCrop.afterUpload = function(context) {
  ManualCrop.init();

  var fields = Drupal.settings.manualCrop.fields;

  for (var identifier in fields) {
    if (fields[identifier].instantCrop) {
      if ($('.manualcrop-cropdata', context).length == 1) {
        $('.manualcrop-style-button, .manualcrop-style-thumb', context).trigger('mousedown');
      }
    }
  }
}

/**
 * Open the cropping tool for an image.
 *
 * @param identifier
 *    Unique crop settings identifier.
 * @param style
 *   The image style name or selection list triggering this event.
 * @param fid
 *   The file id of the image the user is about to crop.
 */
ManualCrop.showCroptool = function(identifier, style, fid) {
  var styleName, styleSelect, cropType, origContainer, conWidth, conHeight;

  if (ManualCrop.croptool) {
    // Close the current croptool.
    ManualCrop.closeCroptool();
  }

  // Get the style name.
  if (typeof style == 'string') {
    styleName = style
  }
  else {
    styleSelect = $(style);
    styleName = styleSelect.val();
  }

  $('.manualcrop-file-' + fid + '-holder img').imagesLoaded(function() {
    // IE executes this callback twice, so we check if the ManualCrop.croptool
    // has already been set and skip the rest if this is the case.
    if (!ManualCrop.croptool) {
      // Determine the croptool type.
      if ($('#manualcrop-overlay-' + fid).length == 1) {
        cropType = 'overlay';
        origContainer = $('#manualcrop-overlay-' + fid);
      }
      else {
        cropType = 'inline';
        origContainer = $('#manualcrop-inline-' + fid);
      }

      // Get the crop settings.
      var settings = Drupal.settings.manualCrop.styles[styleName] || {};

      // Get the destination field and the current selection.
      ManualCrop.output = $('#manualcrop-area-' + fid + '-' + styleName);
      ManualCrop.oldSelection = ManualCrop.parseStringSelection(ManualCrop.output.val());

      // Create the croptool.
      ManualCrop.croptool = origContainer.clone()
        .removeAttr('id')
        .removeClass('element-hidden');

      // Get the container maximum width and height.
      if (cropType == 'overlay') {
        conWidth = $(window).width();
        conHeight = $(window).height();
      }
      else {
        conWidth = origContainer.parent().innerWidth();
        conHeight = $(window).height();
      }

      // Tool width and height.
      ManualCrop.croptool.css('width', conWidth + 'px');

      if (cropType == 'overlay') {
        ManualCrop.croptool.css('height', conHeight + 'px');
      }

      // Get the image and its dimensions.
      var image = $('.manualcrop-image', origContainer);
      var width = ManualCrop.parseInt(image.width()) || ManualCrop.parseInt(image.attr('width'));
      var height = ManualCrop.parseInt(image.height()) || ManualCrop.parseInt(image.attr('height'));

      // Scale the image to fit the maximum width and height (so all is visible).
      var maxWidth = conWidth - ManualCrop.parseInt(image.css('marginLeft')) - ManualCrop.parseInt(image.css('marginRight'));
      var maxHeight = conHeight - ManualCrop.parseInt(image.css('marginTop')) - ManualCrop.parseInt(image.css('marginBottom'));

      // Calculate the clone image dimensions.
      var resized = ManualCrop.resizeDimensions(width, height, maxWidth, maxHeight);

      // Set the new width and height to the cloned image.
      image = $('.manualcrop-image', ManualCrop.croptool)
        .css('width', resized.width + 'px')
        .css('height', resized.height + 'px');

      // Basic imgAreaSelect options; All options are set - also if it's their
      // default value - because IE doesn't seem to use the default values.
      var options = {
        handles: true,
        instance: true,
        keys: true,
        movable: true,
        resizable: true,
        parent: image.parent(),
        imageWidth: width,
        imageHeight: height,
        onSelectChange: ManualCrop.updateSelection
      };

      // Additional options based upon the effect.
      if (settings) {
        switch (settings.effect) {
          // Crop and scale effect.
          case 'manualcrop_crop_and_scale':
            options.aspectRatio = settings.data.width + ':' + settings.data.height;

            if (settings.data.respectminimum) {
              // Crop at least the minimum.
              options.minWidth = ManualCrop.parseInt(settings.data.width);
              options.minHeight = ManualCrop.parseInt(settings.data.height);
            }
            break;

          // Crop effect.
          case 'manualcrop_crop':
            if (settings.data.width) {
              options.minWidth = ManualCrop.parseInt(settings.data.width);
            }

            if (settings.data.height) {
              options.minHeight = ManualCrop.parseInt(settings.data.height);
            }

            if (typeof settings.data.keepproportions != 'undefined' && settings.data.keepproportions) {
              options.aspectRatio = settings.data.width + ':' + settings.data.height;
            }
        }
      }

      // Set the image style name.
      $('.manualcrop-image-style', ManualCrop.croptool).text(styleName);

      if (typeof styleSelect != 'undefined') {
        // Reset the image style selection list.
        styleSelect.val('');
        styleSelect.blur();
      }
      else {
        // Hide the crop button.
        $('.manualcrop-style-button-' + fid).hide();
      }

      // Append the cropping area (last, to prevent that '_11' is undefined).
      if (cropType == 'overlay') {
        $('body').append(ManualCrop.croptool);
      }
      else {
        origContainer.parent().append(ManualCrop.croptool);
      }

      // Create the crop widget.
      ManualCrop.widget = image.imgAreaSelect(options);

      // IE seems to have some issues with the imgAreaSelect $parent variable,
      // so we set the options again to initialize it correctly.
      if ($.browser.msie) {
        ManualCrop.widget.setOptions(options);
      }

      // Insert the instant preview image.
      var instantPreview = $('.manualcrop-instantpreview', ManualCrop.croptool);
      if (instantPreview.length) {
        // Save the current width as maximum width and height.
        instantPreview
          .data('maxWidth', instantPreview.width())
          .data('maxHeight', instantPreview.width())
          .height(instantPreview.width());

        // Calculate the instant preview dimensions.
        resized = ManualCrop.resizeDimensions(width, height, instantPreview.width(), instantPreview.width());

        // Set those dimensions.
        image.clone().appendTo(instantPreview)
          .removeClass()
          .css('width', resized.width + 'px')
          .css('height', resized.height + 'px');
      }

      if (!ManualCrop.oldSelection) {
        var fields = Drupal.settings.manualCrop.fields;

        // Create a default crop area.
        if (typeof fields[identifier] == 'object' && fields[identifier].defaultCropArea) {
          var minWidth = (typeof options.minWidth != 'undefined' ? options.minWidth : 0);
          var minHeight = (typeof options.minHeight != 'undefined' ? options.minHeight : 0)

          // Set a width and height.
          ManualCrop.oldSelection = {
            width: (minWidth ? minWidth * 100 : (width / 2)),
            height: (minHeight ? minHeight * 100 : (height / 2)),
            maxWidth: (width / 2),
            maxHeight: (height / 2)
          };

          // Resize the selection.
          ManualCrop.oldSelection = ManualCrop.resizeDimensions(ManualCrop.oldSelection);

          // Make sure we respect the minimum dimensions.
          if (minWidth || minHeight) {
            if (minWidth && ManualCrop.oldSelection.width < minWidth) {
              ManualCrop.oldSelection.width = minWidth;

              if (minHeight) {
                ManualCrop.oldSelection.height = minHeight;
              }
            }
            else if (minHeight && ManualCrop.oldSelection.height < minHeight) {
              ManualCrop.oldSelection.height = minHeight;

              if (minWidth) {
                ManualCrop.oldSelection.width = minWidth;
              }
            }
          }

          // Center the selection.
          ManualCrop.oldSelection.x1 = (width - ManualCrop.oldSelection.width) / 2;
          ManualCrop.oldSelection.y1 = (height - ManualCrop.oldSelection.height) / 2;
          ManualCrop.oldSelection.x2 = ManualCrop.oldSelection.x1 + ManualCrop.oldSelection.width;
          ManualCrop.oldSelection.y2 = ManualCrop.oldSelection.y1 + ManualCrop.oldSelection.height;
        }
      }

      // Set the initial selection.
      if (ManualCrop.oldSelection) {
        ManualCrop.croptool.imagesLoaded(ManualCrop.resetSelection);
      }

      // Handle keyboard shortcuts.
      $(document).keyup(ManualCrop.handleKeyboard);
    }
  });
}

/**
 * Close the cropping tool.
 *
 * @param reset
 *   Set to true to reset the selection before closing.
 */
ManualCrop.closeCroptool = function(reset) {
  if (ManualCrop.croptool) {
    if (reset) {
      ManualCrop.resetSelection();
    }

    ManualCrop.output.trigger('change');

    ManualCrop.widget.setOptions({remove: true});
    ManualCrop.croptool.remove();
    ManualCrop.croptool = null;
    ManualCrop.oldSelection = null;
    ManualCrop.widget = null;
    ManualCrop.output = null;

    $('.manualcrop-style-button').show();

    $(document).unbind('keyup', ManualCrop.handleKeyboard);
  }
}

/**
 * Reset the selection to the previous state.
 */
ManualCrop.resetSelection = function() {
  if (ManualCrop.croptool) {
    if (ManualCrop.oldSelection) {
      ManualCrop.widget.setSelection(ManualCrop.oldSelection.x1, ManualCrop.oldSelection.y1, ManualCrop.oldSelection.x2, ManualCrop.oldSelection.y2);
      ManualCrop.widget.setOptions({hide: false, show: true});
      ManualCrop.widget.update();
      ManualCrop.updateSelection(null, ManualCrop.oldSelection);

      // Hide reset button.
      $('.manualcrop-reset', ManualCrop.croptool).hide();
    }
    else {
      ManualCrop.clearSelection();
    }
  }
}

/**
 * Maximize the selection to fill the container as much as possible/allowed.
 */
ManualCrop.maximizeSelection = function() {
  if (ManualCrop.croptool) {
    var image = $('img.manualcrop-image', ManualCrop.croptool);

    // Get the original width and height.
    var origWidth = ManualCrop.parseInt(image.get(0).getAttribute('width'));
    var origHeight = ManualCrop.parseInt(image.get(0).getAttribute('height'))
    var options = ManualCrop.widget.getOptions();

    // Check if the ratio should be respected.
    if (typeof options.aspectRatio != 'undefined' && options.aspectRatio != '') {
      // Get the ratio.
      var ratio = options.aspectRatio.match(/([0-9]+):([0-9]+)/);
      var ratioWidth = ManualCrop.parseInt(ratio[1]);
      var ratioHeight = ManualCrop.parseInt(ratio[2]);

      // Crop area defaults.
      var width = origWidth;
      var height = origHeight;
      var x = 0;
      var y = 0;

      if ((ratioWidth / ratioHeight) > (origWidth / origHeight)) {
        // Crop from top and bottom.
        height = Math.floor((width / ratioWidth) * ratioHeight);
        y = Math.floor((origHeight - height) / 2);
      }
      else {
        // Crop from sides.
        width = Math.floor((origHeight / ratioHeight) * ratioWidth);
        x = Math.floor((origWidth - width) / 2);
      }

      // Set the new selection.
      ManualCrop.widget.setSelection(x, y, (x + width), (y + height));
    }
    else {
      // No ratio requirements, just select the whole image.
      ManualCrop.widget.setSelection(0, 0, origWidth, origHeight);
    }

    // Update the widget and stored selection.
    ManualCrop.widget.setOptions({hide: false, show: true});
    ManualCrop.widget.update();
    ManualCrop.updateSelection(null, ManualCrop.widget.getSelection());
  }
}

/**
 * Remove the selection.
 */
ManualCrop.clearSelection = function() {
  if (ManualCrop.croptool) {
    ManualCrop.widget.setOptions({hide: true, show: false});
    ManualCrop.widget.update();
    ManualCrop.updateSelection();

    // Hide clear button.
    $('.manualcrop-clear', ManualCrop.croptool).hide();
  }
}

/**
 * When a selection updates write the position and dimensions to the output field.
 *
 * @param image
 *   Reference to the image that is being cropped.
 * @param selection
 *   Object defining the current selection.
 */
ManualCrop.updateSelection = function(image, selection) {
  if (ManualCrop.croptool) {
    var resized;

    // Update the image reference.
    image = $('img.manualcrop-image', ManualCrop.croptool);

    // Get the original width and height.
    var origWidth = ManualCrop.parseInt(image.get(0).getAttribute('width'));
    var origHeight = ManualCrop.parseInt(image.get(0).getAttribute('height'))

    // Get the instant preview.
    var instantPreview = $('.manualcrop-instantpreview', ManualCrop.croptool);

    if (selection && selection.width && selection.height && selection.x1 >= 0 && selection.y1 >= 0) {
      ManualCrop.output.val(selection.x1 + '|' + selection.y1 + '|' + selection.width + '|' + selection.height);

      // Update the selection details.
      $('.manualcrop-selection-x', ManualCrop.croptool).text(selection.x1);
      $('.manualcrop-selection-y', ManualCrop.croptool).text(selection.y1);
      $('.manualcrop-selection-width', ManualCrop.croptool).text(selection.width);
      $('.manualcrop-selection-height', ManualCrop.croptool).text(selection.height);

      // Update the instant preview.
      if (instantPreview.length) {
        // Calculate the instant preview dimensions.
        resized = ManualCrop.resizeDimensions(selection.width, selection.height, instantPreview.data('maxWidth'), instantPreview.data('maxHeight'));

        // Set the new width and height to the preview container.
        instantPreview.css({
          width: resized.width + 'px',
          height: resized.height + 'px'
        });

        // Calculate the resize scale.
        var scaleX = resized.width / selection.width;
        var scaleY = resized.height / selection.height;

        // Update the image css.
        $('img', instantPreview).css({
          width: Math.round(scaleX * origWidth) + 'px',
          height: Math.round(scaleY * origHeight) + 'px',
          marginLeft: '-' + Math.round(scaleX * selection.x1) + 'px',
          marginTop: '-' + Math.round(scaleY * selection.y1) + 'px'
        });
      }
    }
    else {
      ManualCrop.output.val('');

      $('.manualcrop-selection-x', ManualCrop.croptool).text('-');
      $('.manualcrop-selection-y', ManualCrop.croptool).text('-');
      $('.manualcrop-selection-width', ManualCrop.croptool).text('-');
      $('.manualcrop-selection-height', ManualCrop.croptool).text('-');

      // Reset the instant preview.
      if (instantPreview.length) {
        instantPreview
          .width(instantPreview.data('maxWidth'))
          .height(instantPreview.data('maxHeight'));

        resized = ManualCrop.resizeDimensions(origWidth, origHeight, instantPreview.width(), instantPreview.height());

        $('img', instantPreview).css({
          width: resized.width + 'px',
          height: resized.height + 'px',
          marginLeft: '0px',
          marginTop: '0px'
        });
      }
    }

    if (ManualCrop.oldSelection) {
      // Show reset button.
      $('.manualcrop-reset', ManualCrop.croptool).show();
    }

    // Hide clear button.
    $('.manualcrop-clear', ManualCrop.croptool).show();
  }
}

/**
 * A new cropping area was saved to the hidden field, update the default image
 * preview and find the corresponding select option or button and append a css
 * class and text to indicate the crop status.
 *
 * This is a seperate function so it can be triggered after loading.
 *
 * @param element
 *   The hidden field that stores the selection.
 * @param fid
 *   The file id.
 * @param styleName
 *   The image style name.
 */
ManualCrop.selectionStored = function(element, fid, styleName) {
  var selection = $(element).val();

  $('.manualcrop-file-' + fid + '-holder img').imagesLoaded(function() {
    var previewHolder = $('.manualcrop-preview-' + fid + '-' + styleName + ' .manualcrop-preview-cropped');
    if (!previewHolder.length) {
      previewHolder = $('.manualcrop-preview-' + fid + ' .manualcrop-preview-cropped');
    }

    var defaultPreview = $('.manualcrop-preview-' + fid + '-' + styleName + ' > img');
    if (!defaultPreview.length) {
      defaultPreview = $('.manualcrop-preview-' + fid + ' > img');
    }

    var toolOpener = $('.manualcrop-style-select-' + fid + " option[value='" + styleName + "'], .manualcrop-style-button-" + fid + ', .manualcrop-style-thumb-' + fid + '-' + styleName + ' .manualcrop-style-thumb-label');
    var hasClass = toolOpener.hasClass('manualcrop-style-cropped');

    if (previewHolder.length && previewHolder.children().length) {
      previewHolder.css({
        width: '0px',
        height: '0px'
      }).html('');
      defaultPreview.css('display', 'block');
    }

    if (selection) {
      if (previewHolder.length) {
        // Get the dimensions of the original preview image and hide it again.
        var maxWidth = ManualCrop.parseInt(defaultPreview.width());
        var maxHeight = ManualCrop.parseInt(defaultPreview.height());

        if (maxWidth > 0) {
          defaultPreview.css('display', 'none');

          // Get the selected crop area.
          selection = ManualCrop.parseStringSelection(selection);

          // Calculate the preview dimensions.
          var resized = ManualCrop.resizeDimensions(selection.width, selection.height, maxWidth, maxHeight);

          // Set the new width and height to the cropped preview holder.
          previewHolder.css({
            width: resized.width + 'px',
            height: resized.height + 'px'
          });

          // Calculate the resize scale.
          var scaleX = resized.width / selection.width;
          var scaleY = resized.height / selection.height;

          // Get the original image.
          var originalImage = $('#manualcrop-overlay-' + fid + ' img.manualcrop-image, #manualcrop-inline-' + fid + ' img.manualcrop-image');

          // Calculate the new width and height using the full image.
          resized.width = Math.round(scaleX * ManualCrop.parseInt(originalImage.width()));
          resized.height = Math.round(scaleY * ManualCrop.parseInt(originalImage.height()));

          // Create and insert the cropped preview.
          previewHolder.append(originalImage.clone().removeClass().css({
            width: resized.width + 'px',
            height: resized.height + 'px',
            marginLeft: '-' + Math.round(scaleX * selection.x1) + 'px',
            marginTop: '-' + Math.round(scaleY * selection.y1) + 'px'
          }));
        }
      }

      if (!hasClass) {
        // Style has been cropped.
        toolOpener.addClass('manualcrop-style-cropped');

        if (toolOpener.is('input')) {
          toolOpener.val(toolOpener.val() + ' ' + Drupal.t('(cropped)'));
        }
        else {
          toolOpener.text(toolOpener.text() + ' ' + Drupal.t('(cropped)'));
        }
      }
    } else if (hasClass) {
      // Style not cropped.
      toolOpener.removeClass('manualcrop-style-cropped');

      if (toolOpener.is('input')) {
        toolOpener.val(toolOpener.val().substr(0, (toolOpener.val().length - Drupal.t('(cropped)').length - 1)));
      }
      else {
        toolOpener.text(toolOpener.text().substr(0, (toolOpener.text().length - Drupal.t('(cropped)').length - 1)));
      }
    }
  });
}

/**
 * Keyboard shortcuts handler.
 *
 * @param e
 *    The event object.
 */
ManualCrop.handleKeyboard = function(e) {
  if (ManualCrop.croptool) {
    if(e.keyCode == 13) {
      // Enter
      ManualCrop.closeCroptool();
    }
    else if(e.keyCode == 27) {
      // Escape
      ManualCrop.closeCroptool(true);
    }
  }
}

/**
 * Parse a string defining the selection to an object.
 *
 * @param txtSelection
 *   The selection as a string e.a.: "x|y|width|height".
 * @return
 *   An object containing defining the selection.
 */
ManualCrop.parseStringSelection = function(txtSelection) {
  if (txtSelection) {
    var parts = txtSelection.split('|');
    var selection = {
      x1: ManualCrop.parseInt(parts[0]),
      y1: ManualCrop.parseInt(parts[1]),
      width: ManualCrop.parseInt(parts[2]),
      height: ManualCrop.parseInt(parts[3])
    };

    selection.x2 = selection.x1 + selection.width;
    selection.y2 = selection.y1 + selection.height;

    return selection;
  }

  return null;
}

/**
 * Parse a textual number to an integer.
 *
 * @param integer
 *   The textual integer.
 * @return
 *   The integer.
 */
ManualCrop.parseInt = function(integer) {
  return (parseInt(integer) || 0)
}

/**
 * Calculate new dimensions based upon a maximum width and height.
 *
 * @param width
 *   The current width or an object width all the properties set.
 * @param height
 *   The current height.
 * @param maxWidth
 *   The maximum width.
 * @param maxHeight
 *   The maximum height.
 * @return
 *   An object with the new width and height as properties.
 */
ManualCrop.resizeDimensions = function(width, height, maxWidth, maxHeight) {
  if (typeof width == 'object') {
    if (typeof width.maxWidth != 'undefined' && width.maxWidth) {
      maxWidth = width.maxWidth;
    }
    else {
      maxWidth = 9999999;
    }

    if (typeof width.maxHeight != 'undefined' && width.maxHeight) {
      maxHeight = width.maxHeight;
    }
    else {
      maxHeight = 9999999;
    }

    height = width.height;
    width = width.width;
  }
  else {
    if (!maxWidth) {
      maxWidth = 9999999;
    }

    if (!maxHeight) {
      maxHeight = 9999999;
    }
  }

  // Calculate the new width and height.
  if(width > maxWidth) {
    height = Math.floor((height * maxWidth) / width);
    width = maxWidth;
  }

  if(height > maxHeight) {
    width = Math.floor((width * maxHeight) / height);
    height = maxHeight;
  }

  return {
    'width': width,
    'height': height
  };
}

$(document).ready(function() {
  ManualCrop.init();

  // Add a blur action to all buttons.
  $('.manualcrop-button').live('mousedown', function() {
    this.blur();
  });

  // Attach behaviors to execute after an ajax call.
  Drupal.behaviors.manualCrop = {
    attach: function(context, settings) {
      // After upload function on image upload.
      $('.ajax-new-content', context).once('manualcrop', function() {
        var element = $(this);

        if (!element.html().length) {
          // If the $form['#file_upload_delta'] is not set or invalid the file module
          // will add an empty <span> as .ajax-new-content element, so we need the
          // previous element to execute the after upload function.
          ManualCrop.afterUpload(element.prev().get(0));
        }
        else {
          ManualCrop.afterUpload(this);
        }
      });

      // Init function if a modal (Media module) was opened.
      $('.modal-content', context).ready(function() {
        ManualCrop.init();
      });
    }
  };
});

})(jQuery);
;
(function ($) {

/**
 * Automatically display the guidelines of the selected text format.
 */
Drupal.behaviors.filterGuidelines = {
  attach: function (context) {
    $('.filter-guidelines', context).once('filter-guidelines')
      .find(':header').hide()
      .closest('.filter-wrapper').find('select.filter-list')
      .bind('change', function () {
        $(this).closest('.filter-wrapper')
          .find('.filter-guidelines-item').hide()
          .siblings('.filter-guidelines-' + this.value).show();
      })
      .change();
  }
};

})(jQuery);
;
(function ($) {

Drupal.behaviors.textarea = {
  attach: function (context, settings) {
    $('.form-textarea-wrapper.resizable', context).once('textarea', function () {
      var staticOffset = null;
      var textarea = $(this).addClass('resizable-textarea').find('textarea');
      var grippie = $('<div class="grippie"></div>').mousedown(startDrag);

      grippie.insertAfter(textarea);

      function startDrag(e) {
        staticOffset = textarea.height() - e.pageY;
        textarea.css('opacity', 0.25);
        $(document).mousemove(performDrag).mouseup(endDrag);
        return false;
      }

      function performDrag(e) {
        textarea.height(Math.max(32, staticOffset + e.pageY) + 'px');
        return false;
      }

      function endDrag(e) {
        $(document).unbind('mousemove', performDrag).unbind('mouseup', endDrag);
        textarea.css('opacity', 1);
      }
    });
  }
};

})(jQuery);
;
eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('(m($){1k W=2v.4N,D=2v.4M,F=2v.4L,u=2v.4K;m V(){C $("<4J/>")};$.N=m(T,c){1k O=$(T),2E,A=V(),1i=V(),I=V().r(V()).r(V()).r(V()),B=V().r(V()).r(V()).r(V()),E=$([]),1J,G,l,17={v:0,l:0},Q,M,1j,1f={v:0,l:0},12=0,1I="1G",2k,2j,1s,1r,S,1A,1z,2o,2n,14,1O,a,b,j,g,f={a:0,b:0,j:0,g:0,H:0,L:0},2u=R.4I,$p,d,i,o,w,h,2p;m 1m(x){C x+17.v-1f.v};m 1l(y){C y+17.l-1f.l};m 1a(x){C x-17.v+1f.v};m 19(y){C y-17.l+1f.l};m 1y(3H){C 3H.4H-1f.v};m 1x(3G){C 3G.4G-1f.l};m 13(30){1k 1h=30||1s,1g=30||1r;C{a:u(f.a*1h),b:u(f.b*1g),j:u(f.j*1h),g:u(f.g*1g),H:u(f.j*1h)-u(f.a*1h),L:u(f.g*1g)-u(f.b*1g)}};m 23(a,b,j,g,2Z){1k 1h=2Z||1s,1g=2Z||1r;f={a:u(a/1h||0),b:u(b/1g||0),j:u(j/1h||0),g:u(g/1g||0)};f.H=f.j-f.a;f.L=f.g-f.b};m 1e(){9(!O.H()){C}17={v:u(O.2t().v),l:u(O.2t().l)};Q=O.2X();M=O.3F();17.l+=(O.2Y()-M)>>1;17.v+=(O.2q()-Q)>>1;1A=u(c.4F/1s)||0;1z=u(c.4E/1r)||0;2o=u(F(c.4D/1s||1<<24,Q));2n=u(F(c.4C/1r||1<<24,M));9($().4B=="1.3.2"&&1I=="21"&&!2u["4A"]){17.l+=D(R.1p.2r,2u.2r);17.v+=D(R.1p.2s,2u.2s)}1f=/1G|4z/.1V(1j.q("1o"))?{v:u(1j.2t().v)-1j.2s(),l:u(1j.2t().l)-1j.2r()}:1I=="21"?{v:$(R).2s(),l:$(R).2r()}:{v:0,l:0};G=1m(0);l=1l(0);9(f.j>Q||f.g>M){1S()}};m 1T(3D){9(!1O){C}A.q({v:1m(f.a),l:1l(f.b)}).r(1i).H(w=f.H).L(h=f.L);1i.r(I).r(E).q({v:0,l:0});I.H(D(w-I.2q()+I.2X(),0)).L(D(h-I.2Y()+I.3F(),0));$(B[0]).q({v:G,l:l,H:f.a,L:M});$(B[1]).q({v:G+f.a,l:l,H:w,L:f.b});$(B[2]).q({v:G+f.j,l:l,H:Q-f.j,L:M});$(B[3]).q({v:G+f.a,l:l+f.g,H:w,L:M-f.g});w-=E.2q();h-=E.2Y();2N(E.3b){15 8:$(E[4]).q({v:w>>1});$(E[5]).q({v:w,l:h>>1});$(E[6]).q({v:w>>1,l:h});$(E[7]).q({l:h>>1});15 4:E.3E(1,3).q({v:w});E.3E(2,4).q({l:h})}9(3D!==Y){9($.N.1Z!=2Q){$(R).U($.N.1Z,$.N.3C)}9(c.1R){$(R)[$.N.1Z]($.N.3C=2Q)}}9($.1b.1E&&I.2q()-I.2X()==2){I.q("3B",0);3u(m(){I.q("3B","4y")},0)}};m 22(3A){1e();1T(3A);a=1m(f.a);b=1l(f.b);j=1m(f.j);g=1l(f.g)};m 27(2W,2w){c.1N?2W.4x(c.1N,2w):2W.1q()};m 1c(2V){1k x=1a(1y(2V))-f.a,y=19(1x(2V))-f.b;9(!2p){1e();2p=11;A.1F("4w",m(){2p=Y})}S="";9(c.2C){9(y<=c.1U){S="n"}X{9(y>=f.L-c.1U){S="s"}}9(x<=c.1U){S+="w"}X{9(x>=f.H-c.1U){S+="e"}}}A.q("2U",S?S+"-18":c.26?"4v":"");9(1J){1J.4u()}};m 2R(4t){$("1p").q("2U","");9(c.4s||f.H*f.L==0){27(A.r(B),m(){$(J).1q()})}$(R).U("P",2l);A.P(1c);c.2f(T,13())};m 2B(1W){9(1W.3w!=1){C Y}1e();9(S){$("1p").q("2U",S+"-18");a=1m(f[/w/.1V(S)?"j":"a"]);b=1l(f[/n/.1V(S)?"g":"b"]);$(R).P(2l).1F("1w",2R);A.U("P",1c)}X{9(c.26){2k=G+f.a-1y(1W);2j=l+f.b-1x(1W);A.U("P",1c);$(R).P(2S).1F("1w",m(){c.2f(T,13());$(R).U("P",2S);A.P(1c)})}X{O.1M(1W)}}C Y};m 1v(3z){9(14){9(3z){j=D(G,F(G+Q,a+W(g-b)*14*(j>a||-1)));g=u(D(l,F(l+M,b+W(j-a)/14*(g>b||-1))));j=u(j)}X{g=D(l,F(l+M,b+W(j-a)/14*(g>b||-1)));j=u(D(G,F(G+Q,a+W(g-b)*14*(j>a||-1))));g=u(g)}}};m 1S(){a=F(a,G+Q);b=F(b,l+M);9(W(j-a)<1A){j=a-1A*(j<a||-1);9(j<G){a=G+1A}X{9(j>G+Q){a=G+Q-1A}}}9(W(g-b)<1z){g=b-1z*(g<b||-1);9(g<l){b=l+1z}X{9(g>l+M){b=l+M-1z}}}j=D(G,F(j,G+Q));g=D(l,F(g,l+M));1v(W(j-a)<W(g-b)*14);9(W(j-a)>2o){j=a-2o*(j<a||-1);1v()}9(W(g-b)>2n){g=b-2n*(g<b||-1);1v(11)}f={a:1a(F(a,j)),j:1a(D(a,j)),b:19(F(b,g)),g:19(D(b,g)),H:W(j-a),L:W(g-b)};1T();c.2g(T,13())};m 2l(2T){j=/w|e|^$/.1V(S)||14?1y(2T):1m(f.j);g=/n|s|^$/.1V(S)||14?1x(2T):1l(f.g);1S();C Y};m 1u(3y,3x){j=(a=3y)+f.H;g=(b=3x)+f.L;$.2c(f,{a:1a(a),b:19(b),j:1a(j),g:19(g)});1T();c.2g(T,13())};m 2S(2m){a=D(G,F(2k+1y(2m),G+Q-f.H));b=D(l,F(2j+1x(2m),l+M-f.L));1u(a,b);2m.4r();C Y};m 2h(){$(R).U("P",2h);1e();j=a;g=b;1S();S="";9(!B.2y(":4q")){A.r(B).1q().2D(c.1N||0)}1O=11;$(R).U("1w",1L).P(2l).1F("1w",2R);A.U("P",1c);c.3v(T,13())};m 1L(){$(R).U("P",2h).U("1w",1L);27(A.r(B));23(1a(a),19(b),1a(a),19(b));9(!J 4p $.N){c.2g(T,13());c.2f(T,13())}};m 2z(2i){9(2i.3w!=1||B.2y(":4o")){C Y}1e();2k=a=1y(2i);2j=b=1x(2i);$(R).P(2h).1w(1L);C Y};m 2A(){22(Y)};m 2x(){2E=11;25(c=$.2c({1Q:"4n",26:11,20:"1p",2C:11,1U:10,3t:m(){},3v:m(){},2g:m(){},2f:m(){}},c));A.r(B).q({36:""});9(c.2F){1O=11;1e();1T();A.r(B).1q().2D(c.1N||0)}3u(m(){c.3t(T,13())},0)};1k 2Q=m(16){1k k=c.1R,d,t,2M=16.4m;d=!1K(k.2O)&&(16.2e||16.3q.2e)?k.2O:!1K(k.2a)&&16.3r?k.2a:!1K(k.2b)&&16.3s?k.2b:!1K(k.2P)?k.2P:10;9(k.2P=="18"||(k.2b=="18"&&16.3s)||(k.2a=="18"&&16.3r)||(k.2O=="18"&&(16.2e||16.3q.2e))){2N(2M){15 37:d=-d;15 39:t=D(a,j);a=F(a,j);j=D(t+d,a);1v();1t;15 38:d=-d;15 40:t=D(b,g);b=F(b,g);g=D(t+d,b);1v(11);1t;3p:C}1S()}X{a=F(a,j);b=F(b,g);2N(2M){15 37:1u(D(a-d,G),b);1t;15 38:1u(a,D(b-d,l));1t;15 39:1u(a+F(d,Q-1a(j)),b);1t;15 40:1u(a,b+F(d,M-19(g)));1t;3p:C}}C Y};m 1P(3o,2L){3m(2d 4l 2L){9(c[2d]!==1X){3o.q(2L[2d],c[2d])}}};m 25(K){9(K.20){(1j=$(K.20)).3g(A.r(B))}$.2c(c,K);1e();9(K.2K!=3n){E.1n();E=$([]);i=K.2K?K.2K=="4k"?4:8:0;3c(i--){E=E.r(V())}E.29(c.1Q+"-4j").q({1o:"1G",34:0,1H:12+1||1});9(!4i(E.q("H"))>=0){E.H(5).L(5)}9(o=c.2J){E.q({2J:o,2G:"3j"})}1P(E,{3k:"2I-28",3i:"2H-28",3l:"1d"})}1s=c.4h/Q||1;1r=c.4g/M||1;9(K.a!=3n){23(K.a,K.b,K.j,K.g);K.2F=!K.1q}9(K.1R){c.1R=$.2c({2b:1,2a:"18"},K.1R)}B.29(c.1Q+"-4f");1i.29(c.1Q+"-4e");3m(i=0;i++<4;){$(I[i-1]).29(c.1Q+"-2I"+i)}1P(1i,{4d:"2H-28",4c:"1d"});1P(I,{3l:"1d",2J:"2I-H"});1P(B,{4b:"2H-28",4a:"1d"});9(o=c.3k){$(I[0]).q({2G:"3j",3h:o})}9(o=c.3i){$(I[1]).q({2G:"49",3h:o})}A.3g(1i.r(I).r(1J).r(E));9($.1b.1E){9(o=B.q("3f").3e(/1d=(\\d+)/)){B.q("1d",o[1]/1Y)}9(o=I.q("3f").3e(/1d=(\\d+)/)){I.q("1d",o[1]/1Y)}}9(K.1q){27(A.r(B))}X{9(K.2F&&2E){1O=11;A.r(B).2D(c.1N||0);22()}}14=(d=(c.48||"").47(/:/))[0]/d[1];O.r(B).U("1M",2z);9(c.1D||c.1C===Y){A.U("P",1c).U("1M",2B);$(3d).U("18",2A)}X{9(c.1C||c.1D===Y){9(c.2C||c.26){A.P(1c).1M(2B)}$(3d).18(2A)}9(!c.46){O.r(B).1M(2z)}}c.1C=c.1D=1X};J.1n=m(){25({1D:11});A.r(B).1n()};J.45=m(){C c};J.31=25;J.44=13;J.43=23;J.42=1L;J.41=22;$p=O;3c($p.3b){12=D(12,!1K($p.q("z-3a"))?$p.q("z-3a"):12);9($p.q("1o")=="21"){1I="21"}$p=$p.20(":3Z(1p)")}12=c.1H||12;9($.1b.1E){O.3Y("3X","3W")}$.N.1Z=$.1b.1E||$.1b.3V?"3U":"3T";9($.1b.3S){1J=V().q({H:"1Y%",L:"1Y%",1o:"1G",1H:12+2||2})}A.r(B).q({36:"35",1o:1I,3R:"35",1H:12||"0"});A.q({1H:12+2||2});1i.r(I).q({1o:"1G",34:0});T.33||T.3Q=="33"||!O.2y("3P")?2x():O.1F("3O",2x);9($.1b.1E&&$.1b.3N>=7){T.32=T.32}};$.2w.N=m(Z){Z=Z||{};J.3M(m(){9($(J).1B("N")){9(Z.1n){$(J).1B("N").1n();$(J).3L("N")}X{$(J).1B("N").31(Z)}}X{9(!Z.1n){9(Z.1C===1X&&Z.1D===1X){Z.1C=11}$(J).1B("N",3K $.N(J,Z))}}});9(Z.3J){C $(J).1B("N")}C J}})(3I);',62,298,'|||||||||if|x1|y1|_7|||_23|y2|||x2||top|function||||css|add|||_4|left|||||_a|_d|return|_2|_e|_3|_10|width|_c|this|_53|height|_13|imgAreaSelect|_8|mousemove|_12|document|_1c|_6|unbind|_5|_1|else|false|_54||true|_16|_2c|_21|case|_4f|_11|resize|_29|_28|browser|_39|opacity|_30|_15|sy|sx|_b|_14|var|_27|_26|remove|position|body|hide|_1b|_1a|break|_44|_41|mouseup|evY|evX|_1e|_1d|data|enable|disable|msie|one|absolute|zIndex|_17|_f|isNaN|_49|mousedown|fadeSpeed|_22|_50|classPrefix|keys|_31|_32|resizeMargin|test|_3f|undefined|100|keyPress|parent|fixed|_35|_2e||_4e|movable|_37|color|addClass|ctrl|shift|extend|option|altKey|onSelectEnd|onSelectChange|_48|_4b|_19|_18|_3d|_47|_20|_1f|_25|outerWidth|scrollTop|scrollLeft|offset|_24|Math|fn|_4d|is|_4a|_4c|_3e|resizable|fadeIn|_9|show|borderStyle|background|border|borderWidth|handles|_52|key|switch|alt|arrows|_34|_3b|_40|_43|cursor|_3a|_38|innerWidth|outerHeight|_2f|_2d|setOptions|src|complete|fontSize|hidden|visibility||||index|length|while|window|match|filter|append|borderColor|borderColor2|solid|borderColor1|borderOpacity|for|null|_51|default|originalEvent|ctrlKey|shiftKey|onInit|setTimeout|onSelectStart|which|_46|_45|_42|_36|margin|onKeyPress|_33|slice|innerHeight|_2b|_2a|jQuery|instance|new|removeData|each|version|load|img|readyState|overflow|opera|keypress|keydown|safari|on|unselectable|attr|not||update|cancelSelection|setSelection|getSelection|getOptions|persistent|split|aspectRatio|dashed|outerOpacity|outerColor|selectionOpacity|selectionColor|selection|outer|imageHeight|imageWidth|parseInt|handle|corners|in|keyCode|imgareaselect|animated|instanceof|visible|preventDefault|autoHide|_3c|toggle|move|mouseout|fadeOut|auto|relative|getBoundingClientRect|jquery|maxHeight|maxWidth|minHeight|minWidth|pageY|pageX|documentElement|div|round|min|max|abs'.split('|')))
;
(function(c,n){var k="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";c.fn.imagesLoaded=function(l){function m(){var b=c(h),a=c(g);d&&(g.length?d.reject(e,b,a):d.resolve(e));c.isFunction(l)&&l.call(f,e,b,a)}function i(b,a){b.src===k||-1!==c.inArray(b,j)||(j.push(b),a?g.push(b):h.push(b),c.data(b,"imagesLoaded",{isBroken:a,src:b.src}),o&&d.notifyWith(c(b),[a,e,c(h),c(g)]),e.length===j.length&&(setTimeout(m),e.unbind(".imagesLoaded")))}var f=this,d=c.isFunction(c.Deferred)?c.Deferred():
0,o=c.isFunction(d.notify),e=f.find("img").add(f.filter("img")),j=[],h=[],g=[];e.length?e.bind("load.imagesLoaded error.imagesLoaded",function(b){i(b.target,"error"===b.type)}).each(function(b,a){var e=a.src,d=c.data(a,"imagesLoaded");if(d&&d.src===e)i(a,d.isBroken);else if(a.complete&&a.naturalWidth!==n)i(a,0===a.naturalWidth||0===a.naturalHeight);else if(a.readyState||a.complete)a.src=k,a.src=e}):m();return d?d.promise(f):f}})(jQuery);
;
(function ($) {

/**
 * Attaches sticky table headers.
 */
Drupal.behaviors.tableHeader = {
  attach: function (context, settings) {
    if (!$.support.positionFixed) {
      return;
    }

    $('table.sticky-enabled', context).once('tableheader', function () {
      $(this).data("drupal-tableheader", new Drupal.tableHeader(this));
    });
  }
};

/**
 * Constructor for the tableHeader object. Provides sticky table headers.
 *
 * @param table
 *   DOM object for the table to add a sticky header to.
 */
Drupal.tableHeader = function (table) {
  var self = this;

  this.originalTable = $(table);
  this.originalHeader = $(table).children('thead');
  this.originalHeaderCells = this.originalHeader.find('> tr > th');
  this.displayWeight = null;

  // React to columns change to avoid making checks in the scroll callback.
  this.originalTable.bind('columnschange', function (e, display) {
    // This will force header size to be calculated on scroll.
    self.widthCalculated = (self.displayWeight !== null && self.displayWeight === display);
    self.displayWeight = display;
  });

  // Clone the table header so it inherits original jQuery properties. Hide
  // the table to avoid a flash of the header clone upon page load.
  this.stickyTable = $('<table class="sticky-header"/>')
    .insertBefore(this.originalTable)
    .css({ position: 'fixed', top: '0px' });
  this.stickyHeader = this.originalHeader.clone(true)
    .hide()
    .appendTo(this.stickyTable);
  this.stickyHeaderCells = this.stickyHeader.find('> tr > th');

  this.originalTable.addClass('sticky-table');
  $(window)
    .bind('scroll.drupal-tableheader', $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    .bind('resize.drupal-tableheader', { calculateWidth: true }, $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    // Make sure the anchor being scrolled into view is not hidden beneath the
    // sticky table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceAnchor.drupal-tableheader', function () {
      window.scrollBy(0, -self.stickyTable.outerHeight());
    })
    // Make sure the element being focused is not hidden beneath the sticky
    // table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceFocus.drupal-tableheader', function (event) {
      if (self.stickyVisible && event.clientY < (self.stickyOffsetTop + self.stickyTable.outerHeight()) && event.$target.closest('sticky-header').length === 0) {
        window.scrollBy(0, -self.stickyTable.outerHeight());
      }
    })
    .triggerHandler('resize.drupal-tableheader');

  // We hid the header to avoid it showing up erroneously on page load;
  // we need to unhide it now so that it will show up when expected.
  this.stickyHeader.show();
};

/**
 * Event handler: recalculates position of the sticky table header.
 *
 * @param event
 *   Event being triggered.
 */
Drupal.tableHeader.prototype.eventhandlerRecalculateStickyHeader = function (event) {
  var self = this;
  var calculateWidth = event.data && event.data.calculateWidth;

  // Reset top position of sticky table headers to the current top offset.
  this.stickyOffsetTop = Drupal.settings.tableHeaderOffset ? eval(Drupal.settings.tableHeaderOffset + '()') : 0;
  this.stickyTable.css('top', this.stickyOffsetTop + 'px');

  // Save positioning data.
  var viewHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  if (calculateWidth || this.viewHeight !== viewHeight) {
    this.viewHeight = viewHeight;
    this.vPosition = this.originalTable.offset().top - 4 - this.stickyOffsetTop;
    this.hPosition = this.originalTable.offset().left;
    this.vLength = this.originalTable[0].clientHeight - 100;
    calculateWidth = true;
  }

  // Track horizontal positioning relative to the viewport and set visibility.
  var hScroll = document.documentElement.scrollLeft || document.body.scrollLeft;
  var vOffset = (document.documentElement.scrollTop || document.body.scrollTop) - this.vPosition;
  this.stickyVisible = vOffset > 0 && vOffset < this.vLength;
  this.stickyTable.css({ left: (-hScroll + this.hPosition) + 'px', visibility: this.stickyVisible ? 'visible' : 'hidden' });

  // Only perform expensive calculations if the sticky header is actually
  // visible or when forced.
  if (this.stickyVisible && (calculateWidth || !this.widthCalculated)) {
    this.widthCalculated = true;
    var $that = null;
    var $stickyCell = null;
    var display = null;
    var cellWidth = null;
    // Resize header and its cell widths.
    // Only apply width to visible table cells. This prevents the header from
    // displaying incorrectly when the sticky header is no longer visible.
    for (var i = 0, il = this.originalHeaderCells.length; i < il; i += 1) {
      $that = $(this.originalHeaderCells[i]);
      $stickyCell = this.stickyHeaderCells.eq($that.index());
      display = $that.css('display');
      if (display !== 'none') {
        cellWidth = $that.css('width');
        // Exception for IE7.
        if (cellWidth === 'auto') {
          cellWidth = $that[0].clientWidth + 'px';
        }
        $stickyCell.css({'width': cellWidth, 'display': display});
      }
      else {
        $stickyCell.css('display', 'none');
      }
    }
    this.stickyTable.css('width', this.originalTable.css('width'));
  }
};

})(jQuery);
;
/**
 * @file
 * Provides JavaScript additions to the managed file field type.
 *
 * This file provides progress bar support (if available), popup windows for
 * file previews, and disabling of other file fields during Ajax uploads (which
 * prevents separate file fields from accidentally uploading files).
 */

(function ($) {

/**
 * Attach behaviors to managed file element upload fields.
 */
Drupal.behaviors.fileValidateAutoAttach = {
  attach: function (context, settings) {
    if (settings.file && settings.file.elements) {
      $.each(settings.file.elements, function(selector) {
        var extensions = settings.file.elements[selector];
        $(selector, context).bind('change', {extensions: extensions}, Drupal.file.validateExtension);
      });
    }
  },
  detach: function (context, settings) {
    if (settings.file && settings.file.elements) {
      $.each(settings.file.elements, function(selector) {
        $(selector, context).unbind('change', Drupal.file.validateExtension);
      });
    }
  }
};

/**
 * Attach behaviors to the file upload and remove buttons.
 */
Drupal.behaviors.fileButtons = {
  attach: function (context) {
    $('input.form-submit', context).bind('mousedown', Drupal.file.disableFields);
    $('div.form-managed-file input.form-submit', context).bind('mousedown', Drupal.file.progressBar);
  },
  detach: function (context) {
    $('input.form-submit', context).unbind('mousedown', Drupal.file.disableFields);
    $('div.form-managed-file input.form-submit', context).unbind('mousedown', Drupal.file.progressBar);
  }
};

/**
 * Attach behaviors to links within managed file elements.
 */
Drupal.behaviors.filePreviewLinks = {
  attach: function (context) {
    $('div.form-managed-file .file a, .file-widget .file a', context).bind('click',Drupal.file.openInNewWindow);
  },
  detach: function (context){
    $('div.form-managed-file .file a, .file-widget .file a', context).unbind('click', Drupal.file.openInNewWindow);
  }
};

/**
 * File upload utility functions.
 */
Drupal.file = Drupal.file || {
  /**
   * Client-side file input validation of file extensions.
   */
  validateExtension: function (event) {
    // Remove any previous errors.
    $('.file-upload-js-error').remove();

    // Add client side validation for the input[type=file].
    var extensionPattern = event.data.extensions.replace(/,\s*/g, '|');
    if (extensionPattern.length > 1 && this.value.length > 0) {
      var acceptableMatch = new RegExp('\\.(' + extensionPattern + ')$', 'gi');
      if (!acceptableMatch.test(this.value)) {
        var error = Drupal.t("The selected file %filename cannot be uploaded. Only files with the following extensions are allowed: %extensions.", {
          // According to the specifications of HTML5, a file upload control
          // should not reveal the real local path to the file that a user
          // has selected. Some web browsers implement this restriction by
          // replacing the local path with "C:\fakepath\", which can cause
          // confusion by leaving the user thinking perhaps Drupal could not
          // find the file because it messed up the file path. To avoid this
          // confusion, therefore, we strip out the bogus fakepath string.
          '%filename': this.value.replace('C:\\fakepath\\', ''),
          '%extensions': extensionPattern.replace(/\|/g, ', ')
        });
        $(this).closest('div.form-managed-file').prepend('<div class="messages error file-upload-js-error">' + error + '</div>');
        this.value = '';
        return false;
      }
    }
  },
  /**
   * Prevent file uploads when using buttons not intended to upload.
   */
  disableFields: function (event){
    var clickedButton = this;

    // Only disable upload fields for Ajax buttons.
    if (!$(clickedButton).hasClass('ajax-processed')) {
      return;
    }

    // Check if we're working with an "Upload" button.
    var $enabledFields = [];
    if ($(this).closest('div.form-managed-file').length > 0) {
      $enabledFields = $(this).closest('div.form-managed-file').find('input.form-file');
    }

    // Temporarily disable upload fields other than the one we're currently
    // working with. Filter out fields that are already disabled so that they
    // do not get enabled when we re-enable these fields at the end of behavior
    // processing. Re-enable in a setTimeout set to a relatively short amount
    // of time (1 second). All the other mousedown handlers (like Drupal's Ajax
    // behaviors) are excuted before any timeout functions are called, so we
    // don't have to worry about the fields being re-enabled too soon.
    // @todo If the previous sentence is true, why not set the timeout to 0?
    var $fieldsToTemporarilyDisable = $('div.form-managed-file input.form-file').not($enabledFields).not(':disabled');
    $fieldsToTemporarilyDisable.attr('disabled', 'disabled');
    setTimeout(function (){
      $fieldsToTemporarilyDisable.attr('disabled', false);
    }, 1000);
  },
  /**
   * Add progress bar support if possible.
   */
  progressBar: function (event) {
    var clickedButton = this;
    var $progressId = $(clickedButton).closest('div.form-managed-file').find('input.file-progress');
    if ($progressId.length) {
      var originalName = $progressId.attr('name');

      // Replace the name with the required identifier.
      $progressId.attr('name', originalName.match(/APC_UPLOAD_PROGRESS|UPLOAD_IDENTIFIER/)[0]);

      // Restore the original name after the upload begins.
      setTimeout(function () {
        $progressId.attr('name', originalName);
      }, 1000);
    }
    // Show the progress bar if the upload takes longer than half a second.
    setTimeout(function () {
      $(clickedButton).closest('div.form-managed-file').find('div.ajax-progress-bar').slideDown();
    }, 500);
  },
  /**
   * Open links to files within forms in a new window.
   */
  openInNewWindow: function (event) {
    $(this).attr('target', '_blank');
    window.open(this.href, 'filePreview', 'toolbar=0,scrollbars=1,location=1,statusbar=1,menubar=0,resizable=1,width=500,height=550');
    return false;
  }
};

})(jQuery);
;
(function ($) {

/**
 * Toggle the visibility of a fieldset using smooth animations.
 */
Drupal.toggleFieldset = function (fieldset) {
  var $fieldset = $(fieldset);
  if ($fieldset.is('.collapsed')) {
    var $content = $('> .fieldset-wrapper', fieldset).hide();
    $fieldset
      .removeClass('collapsed')
      .trigger({ type: 'collapsed', value: false })
      .find('> legend span.fieldset-legend-prefix').html(Drupal.t('Hide'));
    $content.slideDown({
      duration: 'fast',
      easing: 'linear',
      complete: function () {
        Drupal.collapseScrollIntoView(fieldset);
        fieldset.animating = false;
      },
      step: function () {
        // Scroll the fieldset into view.
        Drupal.collapseScrollIntoView(fieldset);
      }
    });
  }
  else {
    $fieldset.trigger({ type: 'collapsed', value: true });
    $('> .fieldset-wrapper', fieldset).slideUp('fast', function () {
      $fieldset
        .addClass('collapsed')
        .find('> legend span.fieldset-legend-prefix').html(Drupal.t('Show'));
      fieldset.animating = false;
    });
  }
};

/**
 * Scroll a given fieldset into view as much as possible.
 */
Drupal.collapseScrollIntoView = function (node) {
  var h = document.documentElement.clientHeight || document.body.clientHeight || 0;
  var offset = document.documentElement.scrollTop || document.body.scrollTop || 0;
  var posY = $(node).offset().top;
  var fudge = 55;
  if (posY + node.offsetHeight + fudge > h + offset) {
    if (node.offsetHeight > h) {
      window.scrollTo(0, posY);
    }
    else {
      window.scrollTo(0, posY + node.offsetHeight - h + fudge);
    }
  }
};

Drupal.behaviors.collapse = {
  attach: function (context, settings) {
    $('fieldset.collapsible', context).once('collapse', function () {
      var $fieldset = $(this);
      // Expand fieldset if there are errors inside, or if it contains an
      // element that is targeted by the URI fragment identifier.
      var anchor = location.hash && location.hash != '#' ? ', ' + location.hash : '';
      if ($fieldset.find('.error' + anchor).length) {
        $fieldset.removeClass('collapsed');
      }

      var summary = $('<span class="summary"></span>');
      $fieldset.
        bind('summaryUpdated', function () {
          var text = $.trim($fieldset.drupalGetSummary());
          summary.html(text ? ' (' + text + ')' : '');
        })
        .trigger('summaryUpdated');

      // Turn the legend into a clickable link, but retain span.fieldset-legend
      // for CSS positioning.
      var $legend = $('> legend .fieldset-legend', this);

      $('<span class="fieldset-legend-prefix element-invisible"></span>')
        .append($fieldset.hasClass('collapsed') ? Drupal.t('Show') : Drupal.t('Hide'))
        .prependTo($legend)
        .after(' ');

      // .wrapInner() does not retain bound events.
      var $link = $('<a class="fieldset-title" href="#"></a>')
        .prepend($legend.contents())
        .appendTo($legend)
        .click(function () {
          var fieldset = $fieldset.get(0);
          // Don't animate multiple times.
          if (!fieldset.animating) {
            fieldset.animating = true;
            Drupal.toggleFieldset(fieldset);
          }
          return false;
        });

      $legend.append(summary);
    });
  }
};

})(jQuery);
;
(function ($) {

Drupal.behaviors.menuFieldsetSummaries = {
  attach: function (context) {
    $('fieldset.menu-link-form', context).drupalSetSummary(function (context) {
      if ($('.form-item-menu-enabled input', context).is(':checked')) {
        return Drupal.checkPlain($('.form-item-menu-link-title input', context).val());
      }
      else {
        return Drupal.t('Not in menu');
      }
    });
  }
};

/**
 * Automatically fill in a menu link title, if possible.
 */
Drupal.behaviors.menuLinkAutomaticTitle = {
  attach: function (context) {
    $('fieldset.menu-link-form', context).each(function () {
      // Try to find menu settings widget elements as well as a 'title' field in
      // the form, but play nicely with user permissions and form alterations.
      var $checkbox = $('.form-item-menu-enabled input', this);
      var $link_title = $('.form-item-menu-link-title input', context);
      var $title = $(this).closest('form').find('.form-item-title input');
      // Bail out if we do not have all required fields.
      if (!($checkbox.length && $link_title.length && $title.length)) {
        return;
      }
      // If there is a link title already, mark it as overridden. The user expects
      // that toggling the checkbox twice will take over the node's title.
      if ($checkbox.is(':checked') && $link_title.val().length) {
        $link_title.data('menuLinkAutomaticTitleOveridden', true);
      }
      // Whenever the value is changed manually, disable this behavior.
      $link_title.keyup(function () {
        $link_title.data('menuLinkAutomaticTitleOveridden', true);
      });
      // Global trigger on checkbox (do not fill-in a value when disabled).
      $checkbox.change(function () {
        if ($checkbox.is(':checked')) {
          if (!$link_title.data('menuLinkAutomaticTitleOveridden')) {
            $link_title.val($title.val());
          }
        }
        else {
          $link_title.val('');
          $link_title.removeData('menuLinkAutomaticTitleOveridden');
        }
        $checkbox.closest('fieldset.vertical-tabs-pane').trigger('summaryUpdated');
        $checkbox.trigger('formUpdated');
      });
      // Take over any title change.
      $title.keyup(function () {
        if (!$link_title.data('menuLinkAutomaticTitleOveridden') && $checkbox.is(':checked')) {
          $link_title.val($title.val());
          $link_title.val($title.val()).trigger('formUpdated');
        }
      });
    });
  }
};

})(jQuery);
;
(function ($) {

Drupal.behaviors.pathFieldsetSummaries = {
  attach: function (context) {
    $('fieldset.path-form', context).drupalSetSummary(function (context) {
      var path = $('.form-item-path-alias input').val();
      var automatic = $('.form-item-path-pathauto input').attr('checked');

      if (automatic) {
        return Drupal.t('Automatic alias');
      }
      if (path) {
        return Drupal.t('Alias: @alias', { '@alias': path });
      }
      else {
        return Drupal.t('No alias');
      }
    });
  }
};

})(jQuery);
;

(function ($) {

Drupal.behaviors.commentFieldsetSummaries = {
  attach: function (context) {
    $('fieldset.comment-node-settings-form', context).drupalSetSummary(function (context) {
      return Drupal.checkPlain($('.form-item-comment input:checked', context).next('label').text());
    });

    // Provide the summary for the node type form.
    $('fieldset.comment-node-type-settings-form', context).drupalSetSummary(function(context) {
      var vals = [];

      // Default comment setting.
      vals.push($(".form-item-comment select option:selected", context).text());

      // Threading.
      var threading = $(".form-item-comment-default-mode input:checked", context).next('label').text();
      if (threading) {
        vals.push(threading);
      }

      // Comments per page.
      var number = $(".form-item-comment-default-per-page select option:selected", context).val();
      vals.push(Drupal.t('@number comments per page', {'@number': number}));

      return Drupal.checkPlain(vals.join(', '));
    });
  }
};

})(jQuery);
;

(function ($) {

Drupal.behaviors.metatagFieldsetSummaries = {
  attach: function (context) {
    $('fieldset.metatags-form', context).drupalSetSummary(function (context) {
      var vals = [];
      $("input[type='text'], select, textarea", context).each(function() {
        var default_name = $(this).attr('name').replace(/\[value\]/, '[default]');
        var default_value = $("input[type='hidden'][name='" + default_name + "']", context);
        if (default_value.length && default_value.val() == $(this).val()) {
          // Meta tag has a default value and form value matches default value.
          return true;
        }
        else if (!default_value.length && !$(this).val().length) {
          // Meta tag has no default value and form value is empty.
          return true;
        }
        var label = $("label[for='" + $(this).attr('id') + "']").text();
        vals.push(Drupal.t('@label: @value', {
          '@label': $.trim(label),
          '@value': Drupal.truncate($(this).val(), 25) || Drupal.t('None')
        }));
      });
      if (vals.length === 0) {
        return Drupal.t('Using defaults');
      }
      else {
        return vals.join('<br />');
      }
    });
  }
};

/**
 * Encode special characters in a plain-text string for display as HTML.
 */
Drupal.truncate = function (str, limit) {
  if (str.length > limit) {
    return str.substr(0, limit) + '...';
  }
  else {
    return str;
  }
};

})(jQuery);
;
(function ($) {

/**
 * Attaches the autocomplete behavior to all required fields.
 */
Drupal.behaviors.autocomplete = {
  attach: function (context, settings) {
    var acdb = [];
    $('input.autocomplete', context).once('autocomplete', function () {
      var uri = this.value;
      if (!acdb[uri]) {
        acdb[uri] = new Drupal.ACDB(uri);
      }
      var $input = $('#' + this.id.substr(0, this.id.length - 13))
        .attr('autocomplete', 'OFF')
        .attr('aria-autocomplete', 'list');
      $($input[0].form).submit(Drupal.autocompleteSubmit);
      $input.parent()
        .attr('role', 'application')
        .append($('<span class="element-invisible" aria-live="assertive"></span>')
          .attr('id', $input.attr('id') + '-autocomplete-aria-live')
        );
      new Drupal.jsAC($input, acdb[uri]);
    });
  }
};

/**
 * Prevents the form from submitting if the suggestions popup is open
 * and closes the suggestions popup when doing so.
 */
Drupal.autocompleteSubmit = function () {
  return $('#autocomplete').each(function () {
    this.owner.hidePopup();
  }).length == 0;
};

/**
 * An AutoComplete object.
 */
Drupal.jsAC = function ($input, db) {
  var ac = this;
  this.input = $input[0];
  this.ariaLive = $('#' + this.input.id + '-autocomplete-aria-live');
  this.db = db;

  $input
    .keydown(function (event) { return ac.onkeydown(this, event); })
    .keyup(function (event) { ac.onkeyup(this, event); })
    .blur(function () { ac.hidePopup(); ac.db.cancel(); });

};

/**
 * Handler for the "keydown" event.
 */
Drupal.jsAC.prototype.onkeydown = function (input, e) {
  if (!e) {
    e = window.event;
  }
  switch (e.keyCode) {
    case 40: // down arrow.
      this.selectDown();
      return false;
    case 38: // up arrow.
      this.selectUp();
      return false;
    default: // All other keys.
      return true;
  }
};

/**
 * Handler for the "keyup" event.
 */
Drupal.jsAC.prototype.onkeyup = function (input, e) {
  if (!e) {
    e = window.event;
  }
  switch (e.keyCode) {
    case 16: // Shift.
    case 17: // Ctrl.
    case 18: // Alt.
    case 20: // Caps lock.
    case 33: // Page up.
    case 34: // Page down.
    case 35: // End.
    case 36: // Home.
    case 37: // Left arrow.
    case 38: // Up arrow.
    case 39: // Right arrow.
    case 40: // Down arrow.
      return true;

    case 9:  // Tab.
    case 13: // Enter.
    case 27: // Esc.
      this.hidePopup(e.keyCode);
      return true;

    default: // All other keys.
      if (input.value.length > 0 && !input.readOnly) {
        this.populatePopup();
      }
      else {
        this.hidePopup(e.keyCode);
      }
      return true;
  }
};

/**
 * Puts the currently highlighted suggestion into the autocomplete field.
 */
Drupal.jsAC.prototype.select = function (node) {
  this.input.value = $(node).data('autocompleteValue');
};

/**
 * Highlights the next suggestion.
 */
Drupal.jsAC.prototype.selectDown = function () {
  if (this.selected && this.selected.nextSibling) {
    this.highlight(this.selected.nextSibling);
  }
  else if (this.popup) {
    var lis = $('li', this.popup);
    if (lis.length > 0) {
      this.highlight(lis.get(0));
    }
  }
};

/**
 * Highlights the previous suggestion.
 */
Drupal.jsAC.prototype.selectUp = function () {
  if (this.selected && this.selected.previousSibling) {
    this.highlight(this.selected.previousSibling);
  }
};

/**
 * Highlights a suggestion.
 */
Drupal.jsAC.prototype.highlight = function (node) {
  if (this.selected) {
    $(this.selected).removeClass('selected');
  }
  $(node).addClass('selected');
  this.selected = node;
  $(this.ariaLive).html($(this.selected).html());
};

/**
 * Unhighlights a suggestion.
 */
Drupal.jsAC.prototype.unhighlight = function (node) {
  $(node).removeClass('selected');
  this.selected = false;
  $(this.ariaLive).empty();
};

/**
 * Hides the autocomplete suggestions.
 */
Drupal.jsAC.prototype.hidePopup = function (keycode) {
  // Select item if the right key or mousebutton was pressed.
  if (this.selected && ((keycode && keycode != 46 && keycode != 8 && keycode != 27) || !keycode)) {
    this.input.value = $(this.selected).data('autocompleteValue');
  }
  // Hide popup.
  var popup = this.popup;
  if (popup) {
    this.popup = null;
    $(popup).fadeOut('fast', function () { $(popup).remove(); });
  }
  this.selected = false;
  $(this.ariaLive).empty();
};

/**
 * Positions the suggestions popup and starts a search.
 */
Drupal.jsAC.prototype.populatePopup = function () {
  var $input = $(this.input);
  var position = $input.position();
  // Show popup.
  if (this.popup) {
    $(this.popup).remove();
  }
  this.selected = false;
  this.popup = $('<div id="autocomplete"></div>')[0];
  this.popup.owner = this;
  $(this.popup).css({
    top: parseInt(position.top + this.input.offsetHeight, 10) + 'px',
    left: parseInt(position.left, 10) + 'px',
    width: $input.innerWidth() + 'px',
    display: 'none'
  });
  $input.before(this.popup);

  // Do search.
  this.db.owner = this;
  this.db.search(this.input.value);
};

/**
 * Fills the suggestion popup with any matches received.
 */
Drupal.jsAC.prototype.found = function (matches) {
  // If no value in the textfield, do not show the popup.
  if (!this.input.value.length) {
    return false;
  }

  // Prepare matches.
  var ul = $('<ul></ul>');
  var ac = this;
  for (key in matches) {
    $('<li></li>')
      .html($('<div></div>').html(matches[key]))
      .mousedown(function () { ac.select(this); })
      .mouseover(function () { ac.highlight(this); })
      .mouseout(function () { ac.unhighlight(this); })
      .data('autocompleteValue', key)
      .appendTo(ul);
  }

  // Show popup with matches, if any.
  if (this.popup) {
    if (ul.children().length) {
      $(this.popup).empty().append(ul).show();
      $(this.ariaLive).html(Drupal.t('Autocomplete popup'));
    }
    else {
      $(this.popup).css({ visibility: 'hidden' });
      this.hidePopup();
    }
  }
};

Drupal.jsAC.prototype.setStatus = function (status) {
  switch (status) {
    case 'begin':
      $(this.input).addClass('throbbing');
      $(this.ariaLive).html(Drupal.t('Searching for matches...'));
      break;
    case 'cancel':
    case 'error':
    case 'found':
      $(this.input).removeClass('throbbing');
      break;
  }
};

/**
 * An AutoComplete DataBase object.
 */
Drupal.ACDB = function (uri) {
  this.uri = uri;
  this.delay = 300;
  this.cache = {};
};

/**
 * Performs a cached and delayed search.
 */
Drupal.ACDB.prototype.search = function (searchString) {
  var db = this;
  this.searchString = searchString;

  // See if this string needs to be searched for anyway.
  searchString = searchString.replace(/^\s+|\s+$/, '');
  if (searchString.length <= 0 ||
    searchString.charAt(searchString.length - 1) == ',') {
    return;
  }

  // See if this key has been searched for before.
  if (this.cache[searchString]) {
    return this.owner.found(this.cache[searchString]);
  }

  // Initiate delayed search.
  if (this.timer) {
    clearTimeout(this.timer);
  }
  this.timer = setTimeout(function () {
    db.owner.setStatus('begin');

    // Ajax GET request for autocompletion. We use Drupal.encodePath instead of
    // encodeURIComponent to allow autocomplete search terms to contain slashes.
    $.ajax({
      type: 'GET',
      url: db.uri + '/' + Drupal.encodePath(searchString),
      dataType: 'json',
      success: function (matches) {
        if (typeof matches.status == 'undefined' || matches.status != 0) {
          db.cache[searchString] = matches;
          // Verify if these are still the matches the user wants to see.
          if (db.searchString == searchString) {
            db.owner.found(matches);
          }
          db.owner.setStatus('found');
        }
      },
      error: function (xmlhttp) {
        alert(Drupal.ajaxError(xmlhttp, db.uri));
      }
    });
  }, this.delay);
};

/**
 * Cancels the current autocomplete request.
 */
Drupal.ACDB.prototype.cancel = function () {
  if (this.owner) this.owner.setStatus('cancel');
  if (this.timer) clearTimeout(this.timer);
  this.searchString = '';
};

})(jQuery);
;

(function ($) {

Drupal.behaviors.nodeFieldsetSummaries = {
  attach: function (context) {
    $('fieldset.node-form-revision-information', context).drupalSetSummary(function (context) {
      var revisionCheckbox = $('.form-item-revision input', context);

      // Return 'New revision' if the 'Create new revision' checkbox is checked,
      // or if the checkbox doesn't exist, but the revision log does. For users
      // without the "Administer content" permission the checkbox won't appear,
      // but the revision log will if the content type is set to auto-revision.
      if (revisionCheckbox.is(':checked') || (!revisionCheckbox.length && $('.form-item-log textarea', context).length)) {
        return Drupal.t('New revision');
      }

      return Drupal.t('No revision');
    });

    $('fieldset.node-form-author', context).drupalSetSummary(function (context) {
      var name = $('.form-item-name input', context).val() || Drupal.settings.anonymous,
        date = $('.form-item-date input', context).val();
      return date ?
        Drupal.t('By @name on @date', { '@name': name, '@date': date }) :
        Drupal.t('By @name', { '@name': name });
    });

    $('fieldset.node-form-options', context).drupalSetSummary(function (context) {
      var vals = [];

      $('input:checked', context).parent().each(function () {
        vals.push(Drupal.checkPlain($.trim($(this).text())));
      });

      if (!$('.form-item-status input', context).is(':checked')) {
        vals.unshift(Drupal.t('Not published'));
      }
      return vals.join(', ');
    });
  }
};

})(jQuery);
;
