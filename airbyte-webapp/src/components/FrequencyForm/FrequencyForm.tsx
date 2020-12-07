import React, { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import styled from "styled-components";
import * as yup from "yup";
import { Field, FieldProps, Form, Formik } from "formik";

import LabeledDropDown from "../LabeledDropDown";
import FrequencyConfig from "../../data/FrequencyConfig.json";
import BottomBlock from "./components/BottomBlock";
import Label from "../Label";
import SchemaView from "./components/SchemaView";
import { IDataItem } from "../DropDown/components/ListItem";
import EditControls from "../ServiceForm/components/EditControls";
import { SyncSchema } from "../../core/resources/Schema";
import SaveModal from "./components/SaveModal";

type IProps = {
  className?: string;
  schema: SyncSchema;
  errorMessage?: React.ReactNode;
  successMessage?: React.ReactNode;
  onSubmit: (values: { frequency: string; schema: SyncSchema }) => void;
  onDropDownSelect?: (item: IDataItem) => void;
  frequencyValue?: string;
  isEditMode?: boolean;
};

const SmallLabeledDropDown = styled(LabeledDropDown)`
  max-width: 202px;
`;

const FormContainer = styled(Form)`
  padding: 22px 27px 23px 24px;
`;

const EditLaterMessage = styled(Label)`
  margin: -20px 0 29px;
`;

const connectionValidationSchema = yup.object().shape({
  frequency: yup.string().required("form.empty.error")
});

const FrequencyForm: React.FC<IProps> = ({
  onSubmit,
  className,
  errorMessage,
  schema,
  onDropDownSelect,
  frequencyValue,
  isEditMode,
  successMessage
}) => {
  const initialSchema = React.useMemo(
    () => ({
      streams: schema.streams.map(item => {
        // If syncMode is null, FULL_REFRESH should be selected by default.
        const itemWithSyncMode = !item.syncMode
          ? {
              ...item,
              syncMode: "full_refresh"
            }
          : item;

        // If the value in supportedSyncModes is empty assume the only supported sync mode is FULL_REFRESH.
        // Otherwise it supports whatever sync modes are present.
        return !itemWithSyncMode.supportedSyncModes ||
          !itemWithSyncMode.supportedSyncModes.length
          ? { ...itemWithSyncMode, supportedSyncModes: ["full_refresh"] }
          : itemWithSyncMode;
      })
    }),
    [schema.streams]
  );

  const [newSchema, setNewSchema] = useState(initialSchema);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const formatMessage = useIntl().formatMessage;
  const dropdownData = React.useMemo(
    () =>
      FrequencyConfig.map(item => ({
        ...item,
        text:
          item.value === "manual"
            ? item.text
            : formatMessage(
                {
                  id: "form.every"
                },
                {
                  value: item.text
                }
              )
      })),
    [formatMessage]
  );

  return (
    <Formik
      initialValues={{
        frequency: frequencyValue || ""
      }}
      validateOnBlur={true}
      validateOnChange={true}
      validationSchema={connectionValidationSchema}
      onSubmit={async values => {
        if (
          isEditMode &&
          JSON.stringify(newSchema) !== JSON.stringify(initialSchema)
        ) {
          setModalIsOpen(true);
        } else {
          await onSubmit({ frequency: values.frequency, schema: newSchema });
        }
      }}
    >
      {({
        isSubmitting,
        setFieldValue,
        isValid,
        dirty,
        resetForm,
        values,
        setSubmitting
      }) => (
        <FormContainer className={className}>
          <SchemaView schema={newSchema} onChangeSchema={setNewSchema} />
          {!isEditMode ? (
            <EditLaterMessage
              message={<FormattedMessage id="form.dataSync.message" />}
            />
          ) : null}
          <Field name="frequency">
            {({ field }: FieldProps<string>) => (
              <SmallLabeledDropDown
                {...field}
                labelAdditionLength={300}
                label={formatMessage({
                  id: "form.frequency"
                })}
                message={formatMessage({
                  id: "form.frequency.message"
                })}
                placeholder={formatMessage({
                  id: "form.frequency.placeholder"
                })}
                data={dropdownData}
                onSelect={item => {
                  if (onDropDownSelect) {
                    onDropDownSelect(item);
                  }
                  setFieldValue("frequency", item.value);
                }}
              />
            )}
          </Field>
          {isEditMode ? (
            <>
              <EditControls
                isSubmitting={isSubmitting}
                isValid={isValid}
                dirty={
                  dirty ||
                  JSON.stringify(newSchema) !== JSON.stringify(initialSchema)
                }
                resetForm={resetForm}
                successMessage={successMessage}
                errorMessage={errorMessage}
              />
              {modalIsOpen && (
                <SaveModal
                  onClose={() => setModalIsOpen(false)}
                  onSubmit={async () => {
                    setSubmitting(true);
                    setModalIsOpen(false);
                    await onSubmit({
                      frequency: values.frequency,
                      schema: newSchema
                    });
                    setSubmitting(false);
                  }}
                />
              )}
            </>
          ) : (
            <BottomBlock
              isSubmitting={isSubmitting}
              isValid={isValid}
              dirty={dirty}
              errorMessage={errorMessage}
            />
          )}
        </FormContainer>
      )}
    </Formik>
  );
};

export default FrequencyForm;
