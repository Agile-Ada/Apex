<?php
/**
 * @file
 * apex_slideshow_content_type.features.inc
 */

/**
 * Implements hook_node_info().
 */
function apex_slideshow_content_type_node_info() {
  $items = array(
    'slideshow' => array(
      'name' => t('Slideshow'),
      'base' => 'node_content',
      'description' => t('Slideshow content.'),
      'has_title' => '1',
      'title_label' => t('Title'),
      'help' => '',
    ),
  );
  return $items;
}
