<?php
/**
 * @file
 * cta_block_field.ds.inc
 */

/**
 * Implements hook_ds_custom_fields_info().
 */
function cta_block_field_ds_custom_fields_info() {
  $export = array();

  $ds_field = new stdClass();
  $ds_field->api_version = 1;
  $ds_field->field = 'block_cta';
  $ds_field->label = 'Block: CTA';
  $ds_field->field_type = 6;
  $ds_field->entities = array(
    'node' => 'node',
  );
  $ds_field->ui_limit = '';
  $ds_field->properties = array(
    'block' => 'views|cta-block',
    'block_render' => '3',
  );
  $export['block_cta'] = $ds_field;

  return $export;
}
