class Validators {
  static String? requiredField(String? value, {String fieldName = 'This field'}) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required.';
    }

    return null;
  }

  static String? pin(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'PIN is required.';
    }

    final normalized = value.trim();
    final pinRegex = RegExp(r'^\d{4,6}$');

    if (!pinRegex.hasMatch(normalized)) {
      return 'PIN must be a 4 to 6 digit number.';
    }

    return null;
  }
}
