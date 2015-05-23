<?php

if (module_exists('comment')) {
  /**
   * Plugins are described by creating a $plugin array which will be used
   * by the system that includes this file.
   */
  $plugin = array(
    'single' => TRUE,
    'title' => t('Comment form'),
    'icon' => 'icon_node.png',
    'description' => t('A form to add a new comment.'),
    'required context' => new ctools_context_required(t('Node'), 'node'),
    'category' => t('Node'),
    'defaults' => array('anon_links' => FALSE),
  );
}

function ctools_node_comment_form_content_type_render($subtype, $conf, $panel_args, $context) {
  $node = isset($context->data) ? clone($context->data) : NULL;
  $block = new stdClass();
  $block->module = 'comments';
  $block->delta  = $node->nid;

  $block->title = t('Add comment');

  if (empty($node)) {
    $block->content = t('Comment form here.');
  }
  else if ($node->comment == COMMENT_NODE_OPEN) {
    if (user_access('post comments')) {
      $comment = new stdClass();
      $comment->nid = $node->nid;
      $comment->pid = NULL;
      $form_state = array(
        'ctools comment alter' => TRUE,
        'node' => $node,
        'build_info' => array(
          'args' => array(
            $comment,
          ),
        ),
      );
      $block->content = drupal_build_form('comment_node_' . $node->type . '_form', $form_state);
    }
    else if (!empty($conf['anon_links'])) {
      $block->content = theme('comment_post_forbidden', array('node' => $