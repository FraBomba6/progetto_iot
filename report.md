---
title: "Relazione Progetto IoT - A.A. 2020-2021"
author: |
| Francesco Bombassei De Bona (144665)
date: "27/09/2021"
output:
header-includes:
- \usepackage[margin=0.8in]{geometry}
- \usepackage[italian]{babel}
---

# Introduzione
Il progetto riguarda l'implementazione di un sistema di logging in JavaScript, utilizzando il runtime Node.js, per richieste provenienti da dispositivi IoT con meccanismi di store-and-forward.
Il software riceve comunicazioni da dispositivi IoT tramite WebSocket ed invia i dati che riceve ad un broker MQTT che supporta AMQP 0.9.1 (ad esempio RabbitMQ).
Qualora la connessione non fosse possibile o si chiuda per qualche motivo, il sistema provvede a salvare in locale tutti i dati in arrivo e ad inoltrarli verso il broker una volta ristabilita la connessione.
Al broker MQTT sono poi connessi un numero di consumer pari al numero di thread presenti sulla CPU.

# 
