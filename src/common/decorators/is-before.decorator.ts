import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * @decorator
 * @description A custom validation decorator that checks if a date property is before another date property on the same object.
 * @param property The name of the property to compare against.
 * @param validationOptions Standard class-validator options.
 */
export function IsBefore(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsBeforeConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isBefore' })
class IsBeforeConstraint implements ValidatorConstraintInterface {
  /**
   * @method validate
   * @description Performs the validation logic.
   * @param value The value of the property being decorated.
   * @param args The validation arguments.
   * @returns A boolean indicating if the validation passed.
   */
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];

    // If either value is not present, we skip the validation.
    // Let other validators like @IsNotEmpty() and @IsDateString() handle missing or invalid formats.
    if (!value || !relatedValue) {
      return true;
    }

    const date = new Date(value);
    const relatedDate = new Date(relatedValue);

    // Ensure both dates are valid before comparing
    if (isNaN(date.getTime()) || isNaN(relatedDate.getTime())) {
        return true; // Let @IsDateString handle the invalid date format
    }

    return date < relatedDate;
  }

  /**
   * @method defaultMessage
   * @description Returns the default error message if validation fails.
   * @param args The validation arguments.
   * @returns The error message string.
   */
  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${args.property} must be before ${relatedPropertyName}.`;
  }
}
