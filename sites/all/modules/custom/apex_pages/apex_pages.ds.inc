<?php
/**
 * @file
 * apex_pages.ds.inc
 */

/**
 * Implements hook_ds_field_settings_info().
 */
function apex_pages_ds_field_settings_info() {
  $export = array();

  $ds_fieldsetting = new stdClass();
  $ds_fieldsetting->api_version = 1;
  $ds_fieldsetting->id = 'node|page|default';
  $ds_fieldsetting->entity_type = 'node';
  $ds_fieldsetting->bundle = 'page';
  $ds_fieldsetting->view_mode = 'default';
  $ds_fieldsetting->settings = array(
    'block_cta' => array(
      'weight' => '3',
      'label' => 'hidden',
      'format' => 'default',
    ),
    'block_request_a_quote' => array(
      'weight' => '6',
      'label' => 'hidden',
      'format' => 'default',
    ),
    'request_a_quote' => array(
      'weight' => '1',
      'label' => 'hidden',
      'format' => 'default',
    ),
    'related_sections' => array(
      'weight' => '4',
      'label' => 'hidden',
      'format' => 'default',
    ),
    'title' => array(
      'weight' => '2',
      'label' => 'hidden',
      'format' => 'default',
      'formatter_settings' => array(
        'link' => '0',
        'wrapper' => 'h1',
        'class' => 'page-title',
      ),
    ),
  );
  $export['node|page|default'] = $ds_fieldsetting;

  return $export;
}

/**
 * Implements hook_ds_custom_fields_info().
 */
function apex_pages_ds_custom_fields_info() {
  $export = array();

  $ds_field = new stdClass();
  $ds_field->api_version = 1;
  $ds_field->field = 'cta';
  $ds_field->label = 'CTA';
  $ds_field->field_type = 6;
  $ds_field->entities = array(
    'node' => 'node',
  );
  $ds_field->ui_limit = '';
  $ds_field->properties = array(
    'block' => 'views|cta-block',
    'block_render' => '1',
  );
  $export['cta'] = $ds_field;

  $ds_field = new stdClass();
  $ds_field->api_version = 1;
  $ds_field->field = 'related_sections';
  $ds_field->label = 'Related Sections';
  $ds_field->field_type = 6;
  $ds_field->entities = array(
    'node' => 'node',
  );
  $ds_field->ui_limit = '';
  $ds_field->properties = array(
    'block' => 'menu_block|1',
    'block_render' => '2',
  );
  $export['related_sections'] = $ds_field;

  return $export;
}

/**
 * Implements hook_ds_layout_settings_info().
 */
function apex_pages_ds_layout_settings_info() {
  $export = array();

  $ds_layout = new stdClass();
  $ds_layout->api_version = 1;
  $ds_layout->id = 'node|page|default';
  $ds_layout->entity_type = 'node';
  $ds_layout->bundle = 'page';
  $ds_layout->view_mode = 'default';
  $ds_layout->layout = 'ds_1col';
  $ds_layout->settings = array(
    'regions' => array(
      'ds_content' => array(
        0 => 'field_header_image',
        1 => 'request_a_quote',
        2 => 'group_full_width',
        3 => 'group_left_column',
        4 => 'title',
        5 => 'block_cta',
        6 => 'body',
        7 => 'group_right_column',
        8 => 'related_sections',
        9 => 'block_request_a_quote',
      ),
    ),
    'fields' => array(
      'field_header_image' => 'ds_content',
      'request_a_quote' => 'ds_content',
      'group_full_width' => 'ds_content',
      'group_left_column' => 'ds_content',
      'title' => 'ds_content',
      'block_cta' => 'ds_content',
      'body' => 'ds_content',
      'group_right_column' => 'ds_content',
      'related_sections' => 'ds_content',
      'block_request_a_quote' => 'ds_content',
    ),
    'classes' => array(),
    'wrappers' => array(
      'ds_content' => 'div',
    ),
    'layout_wrapper' => 'div',
    'layout_attributes' => '',
    'layout_attributes_merge' => 1,
  );
  $export['node|page|default'] = $ds_layout;

  return $export;
}
