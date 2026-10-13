/*
 * SPDX-FileCopyrightText: 2022 CERN.
 * SPDX-FileCopyrightText: 2024 KTH Royal Institute of Technology.
 * SPDX-License-Identifier: MIT
 */

import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Form, Formik } from "formik";
import { InvenioAdministrationActionsApi } from "../api/actions";
import { Button, Modal } from "semantic-ui-react";
import { Form as SemanticForm } from "semantic-ui-react";
import _get from "lodash/get";
import { ErrorMessage } from "../ui_messages";
import isEmpty from "lodash/isEmpty";
import { GenerateForm } from "./GenerateForm";
import { deserializeFieldErrors } from "../components/utils";
import { i18next } from "@translations/invenio_administration/i18next";
import Overridable from "react-overridable";

export const ActionFormLayout = ({
  actionSchema,
  actionCancelCallback,
  actionConfig,
  formData = undefined,
  loading = false,
  error = undefined,
  onSubmit,
  resetErrorState = () => {},
  renderFormActions = undefined,
}) => {
  return (
    <Formik initialValues={formData} onSubmit={onSubmit}>
      {(formikProps) => (
        <>
          <Modal.Content>
            <SemanticForm
              as={Form}
              id="action-form"
              onSubmit={formikProps.handleSubmit}
            >
              {actionConfig.description && <p>{i18next.t(actionConfig.description)}</p>}
              <GenerateForm
                jsonSchema={actionSchema}
                formFields={actionSchema}
                create
                dropDumpOnly
                formikProps={formikProps}
                formData={formData}
              />
              {renderFormActions?.(formikProps)}
              {!isEmpty(error) && (
                <ErrorMessage {...error} removeNotification={resetErrorState} />
              )}
            </SemanticForm>
          </Modal.Content>

          <Modal.Actions>
            <Button
              type="button"
              primary
              loading={loading}
              onClick={formikProps.submitForm}
            >
              {i18next.t(actionConfig.submit_button_text || actionConfig.text)}
            </Button>
            <Button
              onClick={actionCancelCallback}
              floated="left"
              icon="cancel"
              labelPosition="left"
              content={i18next.t("Cancel")}
            />
          </Modal.Actions>
        </>
      )}
    </Formik>
  );
};

ActionFormLayout.propTypes = {
  actionSchema: PropTypes.object.isRequired,
  actionKey: PropTypes.string.isRequired,
  actionCancelCallback: PropTypes.func.isRequired,
  formFields: PropTypes.object,
  actionConfig: PropTypes.object.isRequired,
  actionPayload: PropTypes.object,
  error: PropTypes.object,
  formData: PropTypes.object,
  loading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  resetErrorState: PropTypes.func,
  renderFormActions: PropTypes.func,
};

const ActionForm = ({
  resource,
  actionSchema,
  actionKey,
  actionSuccessCallback,
  actionCancelCallback,
  actionConfig,
  actionPayload = {},
  formFields = {},
  renderFormActions = undefined,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);
  const [formData] = useState(actionPayload);

  const getEndpoint = useCallback(
    (actionKey) => {
      let endpoint;
      // get the action endpoint from the current resource links
      endpoint = _get(resource, `links.actions[${actionKey}]`);

      // endpoint can be also within links, not links.action
      // TODO: handle it in a nicer way
      if (isEmpty(endpoint)) {
        endpoint = _get(resource, `links[${actionKey}]`);
      }
      if (!endpoint) {
        console.error("Action endpoint not found in the resource!");
      }
      return endpoint;
    },
    [resource]
  );

  const resetErrorState = useCallback(() => {
    setError(undefined);
  }, []);

  const onSubmit = useCallback(
    async (formData, actions) => {
      setLoading(true);
      const actionEndpoint = getEndpoint(actionKey);

      const args = formData?.args;
      if (args) {
        formData.args = Object.fromEntries(
          Object.entries(args).map(([key, value]) => [key, value === "" ? null : value])
        );
      }

      try {
        const response = await InvenioAdministrationActionsApi.resourceAction(
          actionEndpoint,
          formData
        );
        setLoading(false);
        actionSuccessCallback(response.data);
      } catch (e) {
        console.error(e);
        setLoading(false);
        let errorMessage = e.message;

        // API errors need to be de-serialised to highlight fields.
        const apiResponse = e?.response?.data;
        if (apiResponse) {
          const apiErrors = apiResponse.errors || [];
          const deserializedErrors = deserializeFieldErrors(apiErrors);
          actions.setErrors(deserializedErrors);
          errorMessage = apiResponse.message || errorMessage;
        }

        setError({
          header: i18next.t("Action error"),
          content: errorMessage,
          id: e.code,
        });
      }
    },
    [actionKey, actionSuccessCallback, getEndpoint]
  );

  return (
    <Overridable
      id={`InvenioAdministration.ActionForm.${actionKey}.layout`}
      loading={loading}
      formData={formData}
      error={error}
      resource={resource}
      actionSchema={actionSchema}
      actionKey={actionKey}
      actionSuccessCallback={actionSuccessCallback}
      actionCancelCallback={actionCancelCallback}
      actionConfig={actionConfig}
      actionPayload={actionPayload}
      formFields={formFields}
      renderFormActions={renderFormActions}
    >
      <ActionFormLayout
        actionSchema={actionSchema}
        actionCancelCallback={actionCancelCallback}
        actionConfig={actionConfig}
        actionKey={actionKey}
        loading={loading}
        formData={formData}
        error={error}
        onSubmit={onSubmit}
        resetErrorState={resetErrorState}
        renderFormActions={renderFormActions}
      />
    </Overridable>
  );
};

ActionForm.propTypes = {
  resource: PropTypes.object.isRequired,
  actionSchema: PropTypes.object.isRequired,
  actionKey: PropTypes.string.isRequired,
  actionSuccessCallback: PropTypes.func.isRequired,
  actionCancelCallback: PropTypes.func.isRequired,
  formFields: PropTypes.object,
  actionConfig: PropTypes.object.isRequired,
  actionPayload: PropTypes.object,
  renderFormActions: PropTypes.func,
};

export default Overridable.component("InvenioAdministration.ActionForm", ActionForm);
