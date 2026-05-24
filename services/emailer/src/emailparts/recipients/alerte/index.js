// Recipients for the compliance digest: the organization's registered members.
export function get(recordId, params, data) {
  const landlord = data.landlord || {};

  let emailDeliveryServiceConfig;
  if (landlord.thirdParties?.gmail?.selected) {
    emailDeliveryServiceConfig = landlord.thirdParties.gmail;
  }
  if (landlord.thirdParties?.smtp?.selected) {
    emailDeliveryServiceConfig = landlord.thirdParties.smtp;
  }
  if (landlord.thirdParties?.mailgun?.selected) {
    emailDeliveryServiceConfig = landlord.thirdParties.mailgun;
  }
  if (!emailDeliveryServiceConfig) {
    throw new Error('landlord has not configured an email delivery service');
  }

  const fromEmail = emailDeliveryServiceConfig.fromEmail;
  const replyToEmail = emailDeliveryServiceConfig.replyToEmail;

  const emails = [
    ...new Set(
      (landlord.members || [])
        .filter((member) => member.registered && member.email)
        .map((member) => member.email.toLowerCase())
    )
  ];

  if (!emails.length) {
    throw new Error('organization has no registered member email');
  }

  return emails.map((to) => ({
    from: fromEmail,
    to,
    replyTo: replyToEmail
  }));
}
