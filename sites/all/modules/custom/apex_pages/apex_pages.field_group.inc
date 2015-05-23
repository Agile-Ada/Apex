<?php
/**
 * @file
 * apex_pages.field_group.inc
 */

/**
 * Implements hook_field_group_info().
 */
function apex_pages_field_group_info() {
  $export = array();

  $field_group = new stdClass();
  $field_group->disabled = FALSE; /* Edit this to true to make a default field_group disabled initially */
  $field_group->api_version = 1;
  $field_group->identifier = 'group_full_width|node|page|default';
  $field_group->group_name = 'group_full_width';
  $field_group->entity_type = 'node';
  $field_group->bundle = 'page';
  $field_group->mode = 'default';
  $field_group->parent_name = '';
  $field_group->data = array(
    'label' => 'Full Width',
    'weight' => '2',
    'children' => array(
      0 => 'group_left_column',
      1 => 'group_right_column',
    ),
    'format_type' => 'div',
    'format_settings' => array(
      'label' => 'Full Width',
      'instance_settings' => array(
        'classes' => 'full-width',
        'description' => '',
        'show_label' => '0',
        'label_element' => 'h3',
        'effect' => 'none',
        'speed' => 'none',
      ),
      'formatter' => 'open',
    ),
  );
  $export['group_full_width|node|page|default'] = $field_group;

  $field_group = new stdClass();
  $field_group->disabled = FALSE; /* Edit this to true to make a default field_group disabled initially */
  $field_group->api_version = 1;
  $field_group->identifier = 'group_left_column|node|page|default';
  $field_group->group_name = 'group_left_column';
  $field_group->entity_type = 'node';
  $field_group->bundle = 'page';
  $field_group->mode = 'default';
  $field_group->parent_name = 'group_full_width';
  $field_group->data = array(
    'label' => 'Left Column',
    'weight' => '2',
    'children' => array(
      0 => 'body',
      1 => 'related_sections',
      2 => 'title',
    ),
    'format_type' => 'div',
    'format_settings' => array(
      'label' => 'Left Column',
      'instance_settings' => array(
        'classes' => 'left-column',
        'description' => '',
        'show_label' => '0',
        'label_element' => 'h3',
        'effect' => 'none',
        'speed' => 'none',
      ),
      'formatter' => 'open',
    ),
  );
  $export['group_left_column|node|page|default'] = $field_group;

  $field_group = new stdClass();
  $field_group->disabled = FALSE; /* Edit this to true to make a default field_group disabled initially */
  $field_group->api_version = 1;
  $field_group->identifier = 'group_right_column|node|page|default';
  $field_group->group_name = 'group_right_column';
  $field_group->entity_type = 'node';
  $field_group->bundle = 'page';
  $field_group->mode = 'default';
  $field_group->parent_name = 'group_full_width';
  $field_group->data = array(
    'label' => 'Right Column',
    'weight' => '3',
    'children' => array(
      0 => 'block_request_a_quote',
    ),
    'format_type' => 'div',
    'format_settings' => array(
      'label' => 'Right Column',
      'instance_settings' => array(
        'classes' => 'right-column',
        'description' => '',
        'show_label' => '0',
        'label_element' => 'h3',
        'effect' => 'none',
        'speed' => 'none',
      ),
      'formatter' => 'open',
    ),
  );
  $export['group_right_column|node|page|default'] = $field_group;

  return $export;
}
