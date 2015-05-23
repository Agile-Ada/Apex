<?php
/**
 * @file
 * request_a_quote_block_field.ds.inc
 */

/**
 * Implements hook_ds_custom_fields_info().
 */
function request_a_quote_block_field_ds_custom_fields_info() {
  $export = array();

  $ds_field = new stdClass();
  $ds_field->api_version = 1;
  $ds_field->field = 'block_request_a_quote';
  $ds_field->label = 'Block: Request a Quote';
  $ds_field->field_type = 6;
  $ds_field->entities = array(
    'node' => 'node',
  );
  $ds_field->ui_limit = '';
  $ds_field->properties = array(
    'block' => 'block|14',
    'block_render' => '3',
  );
  $export['block_request_a_quote'] = $ds_field;

  return $export;
}
