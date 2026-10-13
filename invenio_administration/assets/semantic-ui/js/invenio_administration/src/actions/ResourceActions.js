/*
 * SPDX-FileCopyrightText: 2022-2025 CERN.
 * SPDX-License-Identifier: MIT
 */

import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Button, Modal, Icon } from "semantic-ui-react";
import { ActionForm } from "../formik";
import ActionModal from "./ActionModal";
import _get from "lodash/get";
import _isEmpty from "lodash/isEmpty";
import Overridable from "react-overridable";
import { InvenioAdministrationActionsApi } from "../api";

const ResourceActions = ({ resource, successCallback, actions, Element = Button }) => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalHeader, setModalHeader] = useState(undefined);
  const [modalBody, setModalBody] = useState(undefined);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalHeader(undefined);
    setModalBody(undefined);
  }, []);

  const onModalClose = useCallback(
    (data) => {
      setModalOpen(false);
      setModalHeader(undefined);
      setModalBody(undefined);
      if (data?.redirect) {
        window.location.href = data.redirect;
        return;
      }
      successCallback();
    },
    [successCallback]
  );

  // TODO: duplicated from ActionForm - needs refactoring/merge
  const getEndpoint = useCallback(
    (actionKey) => {
      let endpoint = _get(resource, `links.actions[${actionKey}]`);
      // endpoint can be also within links, not links.action
      if (_isEmpty(endpoint)) {
        endpoint = _get(resource, `links[${actionKey}]`);
      }
      if (!endpoint) {
        console.error("Action endpoint not found in the resource!");
      }
      return endpoint;
    },
    [resource]
  );

  const onActionSubmit = useCallback(
    async (actionKey) => {
      setLoading(true);
      try {
        const response = await InvenioAdministrationActionsApi.resourceAction(
          getEndpoint(actionKey)
        );
        // keep buttons disabled while the browser navigates away
        if (!response.data?.redirect) {
          setLoading(false);
        }
        onModalClose(response.data);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    },
    [getEndpoint, onModalClose]
  );

  const onModalTriggerClick = useCallback(
    (payloadSchema, dataName, dataActionKey) => {
      setModalOpen(true);
      setModalHeader(dataName);
      setModalBody(
        <Overridable
          id={`InvenioAdministration.ResourceActions.ModalBody.${dataActionKey}`}
          actionKey={dataActionKey}
          actionSchema={payloadSchema}
          actionSuccessCallback={onModalClose}
          actionCancelCallback={closeModal}
          resource={resource}
          actionConfig={actions[dataActionKey]}
        >
          <ActionForm
            actionKey={dataActionKey}
            actionSchema={payloadSchema}
            actionSuccessCallback={onModalClose}
            actionCancelCallback={closeModal}
            resource={resource}
            actionConfig={actions[dataActionKey]}
          />
        </Overridable>
      );
    },
    [resource, actions, onModalClose, closeModal]
  );

  return (
    <>
      {Object.entries(actions).map(([actionKey, actionConfig]) => {
        const icon = actionConfig.icon;
        const labelPos = icon ? "left" : null;
        return (
          <Element
            key={actionKey}
            onClick={() =>
              _isEmpty(actionConfig.payload_schema)
                ? onActionSubmit(actionKey)
                : onModalTriggerClick(
                    actionConfig.payload_schema,
                    actionConfig.text,
                    actionKey
                  )
            }
            basic
            icon={!_isEmpty(icon)}
            labelPosition={labelPos}
            loading={loading}
            disabled={loading}
          >
            {!_isEmpty(icon) && <Icon name={icon} />}
            {actionConfig.text}...
          </Element>
        );
      })}
      <ActionModal modalOpen={modalOpen} resource={resource}>
        {modalHeader && <Modal.Header>{modalHeader}</Modal.Header>}
        {!_isEmpty(modalBody) && modalBody}
      </ActionModal>
    </>
  );
};

ResourceActions.propTypes = {
  resource: PropTypes.object.isRequired,
  successCallback: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
  Element: PropTypes.elementType,
};

export default Overridable.component(
  "InvenioAdministration.ResourceActions",
  ResourceActions
);
