'use client'
import { FloatingWhatsApp } from '@digicroz/react-floating-whatsapp'

export default function ChatWhatsApp() {
  return (
    <>
      <FloatingWhatsApp
        phoneNumber="8801701645492"
        accountName="Dokani"
        avatar="/images/logo.png"
        statusMessage="Typically replies within 1 hour"
        chatMessage="Hello! 👋 How can we help you today?"
        notification={true}
        notificationSound={true}
      />
    </>
  )
}