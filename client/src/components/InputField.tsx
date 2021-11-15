import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Textarea,
} from "@chakra-ui/react";
import { useField } from "formik";

interface IInputFieldProps {
  name: string;
  label: string;
  placeholder: string;
  type: string;
  textarea?: boolean;
}
const InputField = (props: IInputFieldProps) => {
  const [field, { error }] = useField(props);

  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{props.label}</FormLabel>
      {props.textarea ? (
        <Textarea
          onChange={field.onChange}
          value={field.value}
          id={field.name}
          placeholder={props.placeholder}
          type={props.type}
        />
      ) : (
        <Input
          onChange={field.onChange}
          value={field.value}
          id={field.name}
          placeholder={props.placeholder}
          type={props.type}
        />
      )}
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
};

export default InputField;
