# -*- coding: utf-8 -*-
"""Let's Watch - Proje Raporu PDF v6 - Final (Payment + Layout Fix + Sprint Review)"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, Image, PageBreak, KeepTogether)
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from report_charts import *

pdfmetrics.registerFont(TTFont('Segoe', 'C:/Windows/Fonts/segoeui.ttf'))
pdfmetrics.registerFont(TTFont('SegoeBd', 'C:/Windows/Fonts/segoeuib.ttf'))

OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "LetsWatch_Proje_Raporu.pdf")
PRI = HexColor('#FF8E53'); DRK = HexColor('#1a1a2e'); ACC = HexColor('#e94560')
LBG = HexColor('#f8f9fa'); GRY = HexColor('#6c757d'); TXT = HexColor('#212529')
INF = HexColor('#0d6efd')

def ts(name, parent, **kw):
    return ParagraphStyle(name, parent=parent, fontName=kw.pop('fn', 'Segoe'), **kw)

def build():
    doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
        topMargin=1.5*cm, bottomMargin=1.5*cm, leftMargin=2*cm, rightMargin=2*cm)
    ss = getSampleStyleSheet()
    W = A4[0] - 4*cm

    title = ts('T', ss['Title'], fn='SegoeBd', fontSize=26, textColor=PRI, spaceAfter=4, alignment=TA_CENTER)
    sub = ts('Sub', ss['Normal'], fontSize=11, textColor=GRY, alignment=TA_CENTER, spaceAfter=16)
    h1 = ts('H1', ss['Heading1'], fn='SegoeBd', fontSize=16, textColor=DRK, spaceBefore=16, spaceAfter=8)
    h2 = ts('H2', ss['Heading2'], fn='SegoeBd', fontSize=13, textColor=ACC, spaceBefore=12, spaceAfter=6)
    h3 = ts('H3', ss['Heading3'], fn='SegoeBd', fontSize=10, textColor=INF, spaceBefore=6, spaceAfter=4)
    body = ts('B', ss['Normal'], fontSize=9, textColor=TXT, spaceAfter=5, leading=13, alignment=TA_JUSTIFY)
    bul = ts('Bul', ss['Normal'], fontSize=9, textColor=TXT, leftIndent=18, bulletIndent=8,
             spaceBefore=1, spaceAfter=1, leading=12)
    bul2 = ts('Bul2', ss['Normal'], fontSize=8.5, textColor=TXT, leftIndent=30, bulletIndent=20,
              spaceBefore=1, spaceAfter=1, leading=11)

    def tbl(data, cw):
        t = Table(data, colWidths=cw)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), DRK), ('TEXTCOLOR', (0,0), (-1,0), white),
            ('FONTNAME', (0,0), (-1,0), 'SegoeBd'), ('FONTNAME', (0,1), (-1,-1), 'Segoe'),
            ('FONTSIZE', (0,0), (-1,-1), 8), ('INNERGRID', (0,0), (-1,-1), 0.25, HexColor('#dee2e6')),
            ('BOX', (0,0), (-1,-1), 0.5, DRK), ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#fff'), LBG]),
        ]))
        return t

    S = []

    # =========== KAPAK ===========
    S.append(Spacer(1, 3.5*cm))
    S.append(Paragraph("\U0001f37f Let's Watch", title))
    S.append(Paragraph("Proje Raporu & Teknik Dok\u00fcman", sub))
    S.append(Spacer(1, 0.8*cm))
    S.append(tbl([
        ['Versiyon', 'v1.4.0 (Geli\u015ftirme)'],
        ['Tarih', '12 \u015eubat 2026'],
        ['Ekip', 'Talha Ka\u011fan Tosun (Lead)\nEge Ceylan (Frontend)\nDeniz Eren Bozkurt (QA)'],
        ['Lisans', 'ISC License'],
        ['Repo', 'github.com/taalhaakaagaan/Lets-Watch'],
    ], [3.5*cm, W - 3.5*cm]))
    S.append(PageBreak())

    # =========== 1. PROJE TANIMI ===========
    S.append(Paragraph("1. Proje Tan\u0131m\u0131 ve \u00d6zellikleri", h1))
    S.append(Paragraph(
        "<b>Let's Watch</b>, kullan\u0131c\u0131lar\u0131 <b>Watch & Date</b> konseptiyle bir araya getiren "
        "P2P sosyal platformdur. Oda olu\u015fturma, e\u015fle\u015fme ve video izleme "
        "<b>sunucusuz (P2P)</b> \u00e7al\u0131\u015f\u0131r. Web sitesinin veritaban\u0131 yaln\u0131zca "
        "kullan\u0131c\u0131 verisi, analitik, reklam ve \u00f6deme i\u00e7in kullan\u0131l\u0131r.", body))

    S.append(Paragraph("Temel \u00d6zellikler", h2))
    feats = [
        "<b>Watch & Date Match:</b> Filtrelerle (t\u00fcr, cinsiyet, ya\u015f, dil) "
        "ileri tarihli oda a\u00e7, ba\u015fvuru al, kabul et, birlikte izle.",
        "<b>DM Sistemi:</b> Match sonras\u0131 1:1 kal\u0131c\u0131 mesajla\u015fma. "
        "Film \u00f6ncesi/sonras\u0131 sohbet. AI \u00f6nerileri. P2P data channel.",
        "<b>Ke\u015ffet & Arama:</b> A\u00e7\u0131k odalar\u0131 filtrele ve ara. "
        "Boost ile \u00f6ne \u00e7\u0131kma (premium).",
        "<b>P2P Video Streaming:</b> Lokal video (mp4, mkv, avi) WebRTC "
        "ile merkezi sunucu olmadan do\u011frudan stream.",
        "<b>Screen Share:</b> Netflix, YouTube vb. ekran payla\u015f\u0131m\u0131 "
        "ile birlikte izleme.",
        "<b>AI Dan\u0131\u015fman:</b> Gemini API ile film \u00f6nerisi, "
        "DM sohbet ba\u015flatma yard\u0131m\u0131.",
        "<b>Mood Theme Engine:</b> Film t\u00fcr\u00fcne g\u00f6re "
        "otomatik UI tema de\u011fi\u015fimi.",
        "<b>Reaction Overlay:</b> Canl\u0131 emoji reaksiyonlar\u0131 "
        "ekran \u00fczerinde.",
        "<b>Couple Mode:</b> Ortak izleme ge\u00e7mi\u015fi, "
        "payla\u015f\u0131lan liste.",
        "<b>Cross-Platform:</b> Desktop + Mobil + Chrome Ext + Web.",
        "<b>5 Dil:</b> TR, EN, DE, FR, ES.",
    ]
    for f in feats:
        S.append(Paragraph("\u2022 " + f, bul))
    S.append(PageBreak())

    # =========== 2. KULLANICI AKIŞI ===========
    S.append(Paragraph("2. Kullan\u0131c\u0131 Ak\u0131\u015f\u0131 (Detayl\u0131)", h1))
    S.append(Image(create_user_flow_chart(), width=15*cm, height=6.5*cm))
    S.append(Spacer(1, 6))

    # Adım 1
    S.append(Paragraph("<b>Ad\u0131m 1 \u2014 Kay\u0131t & Profil</b>", h3))
    for x in [
        "E-posta ile kay\u0131t, 6 haneli OTP do\u011frulama.",
        "Onboarding: isim, ya\u015f, cinsiyet, \u00fclke, dil, "
        "favori t\u00fcrler, kara liste.",
        "Mod se\u00e7imi: \"Watch & Date\" veya \"Arkada\u015f Grubu\".",
        "Profil web sitesi DB'ye kaydedilir.",
    ]:
        S.append(Paragraph("\u2013 " + x, bul2))

    # Adım 2
    S.append(Paragraph("<b>Ad\u0131m 2 \u2014 Ke\u015ffet & Arama</b>", h3))
    for x in [
        "Dashboard'da \"Ke\u015ffet\" sekmesi: odalar kart olarak listelenir.",
        "Kart bilgisi: sahibi, ya\u015f, i\u00e7erik, tarih, t\u00fcr, dil, kapasite.",
        "Filtreler: t\u00fcr, tarih, dil, cinsiyet. S\u0131ralama: tarih / "
        "pop\u00fclerlik / boost.",
        "Oda listesi web sitesi DB'den \u00e7ekilir (h\u0131zl\u0131 arama).",
    ]:
        S.append(Paragraph("\u2013 " + x, bul2))

    # Adım 3
    S.append(Paragraph("<b>Ad\u0131m 3 \u2014 Oda A\u00e7 veya Ba\u015fvur</b>", h3))
    for x in [
        "<b>Oda a\u00e7ma:</b> Film/dizi, t\u00fcr, tarih-saat, dil, cinsiyet "
        "filtresi, ya\u015f aral\u0131\u011f\u0131, tan\u0131t\u0131m mesaj\u0131, kapasite.",
        "<b>Boost:</b> $0.99-2.99 \u00f6deyerek ke\u015ffet listesinde \u00fcste "
        "\u00e7\u0131kma \u2192 daha \u00e7ok ba\u015fvuru.",
        "<b>Ba\u015fvuru:</b> K\u0131sa mesaj + profil g\u00f6nderilir. "
        "\u00dccretsiz: 3/g\u00fcn. Boost ($1.99): s\u0131n\u0131rs\u0131z.",
        "Ba\u015fvuru verileri DB'ye kaydedilir (analitik).",
    ]:
        S.append(Paragraph("\u2013 " + x, bul2))

    # Adım 4
    S.append(Paragraph("<b>Ad\u0131m 4 \u2014 Kabul / Red</b>", h3))
    for x in [
        "Oda sahibi ba\u015fvurular\u0131 g\u00f6r\u00fcr: profil, mesaj, ortak tercihler.",
        "Kabul \u2192 otomatik DM kanal\u0131 a\u00e7\u0131l\u0131r.",
        "Red \u2192 bildirim g\u00f6nderilir. Match verisi DB'ye kaydedilir.",
    ]:
        S.append(Paragraph("\u2013 " + x, bul2))

    # Adım 5
    S.append(Paragraph("<b>Ad\u0131m 5 \u2014 DM ile Tan\u0131\u015fma</b>", h3))
    for x in [
        "1:1 DM kanal\u0131 a\u00e7\u0131l\u0131r. Film \u00f6ncesi sohbet.",
        "P2P data channel ile iletim (sunucusuz). "
        "Offline mesajlar cihazda saklan\u0131r.",
        "AI dan\u0131\u015fman: icebreaker \u00f6nerileri, konu \u00f6nerileri.",
        "Online/offline durum, okundu bilgisi, yaz\u0131yor indikat\u00f6r\u00fc.",
        "Profanity filter + engelleme + raporlama aktif.",
    ]:
        S.append(Paragraph("\u2013 " + x, bul2))

    # Adım 6
    S.append(Paragraph("<b>Ad\u0131m 6 \u2014 Watch & Date</b>", h3))
    for x in [
        "Belirlenen saatte oda aktif olur, iki taraf kat\u0131l\u0131r.",
        "Host video se\u00e7er veya ekran payla\u015f\u0131m\u0131 ba\u015flat\u0131r.",
        "Senkron playback: play/pause/seek (<200ms sapma).",
        "Chat + reaction overlay + mood theme aktif.",
        "Sonras\u0131 DM devam, arkada\u015f ekleme, yeni izleme planlama.",
    ]:
        S.append(Paragraph("\u2013 " + x, bul2))
    S.append(PageBreak())

    # =========== 3. DM SİSTEMİ ===========
    S.append(Paragraph("3. DM Sistemi (Kritik Bile\u015fen)", h1))
    S.append(Paragraph(
        "DM, platformun <b>en kritik sosyal bile\u015fenidir</b>. "
        "Kullan\u0131c\u0131lar\u0131 platformda tutan, tekrar getiren ve "
        "ili\u015fkinin s\u00fcreklili\u011fini sa\u011flayan ana mekanizmad\u0131r.", body))
    S.append(tbl([
        ['\u00d6zellik', 'A\u00e7\u0131klama', 'Teknik'],
        ['Kal\u0131c\u0131 Mesaj', 'Match sonras\u0131 s\u00fcresiz DM', 'PeerJS Data Ch. + localStorage'],
        ['Film \u00d6ncesi', 'Kabul sonras\u0131 tan\u0131\u015fma sohbeti', 'Otomatik kanal a\u00e7ma'],
        ['Film Sonras\u0131', '\u0130zleme sonras\u0131 devam', 'Kal\u0131c\u0131 DM kanal\u0131'],
        ['AI \u00d6neriler', 'Icebreaker, konu \u00f6nerileri', 'Gemini context-aware'],
        ['Bildirimler', 'Push notification', 'Service Worker + Push API'],
        ['Yaz\u0131yor...', 'Realtime g\u00f6sterge', 'P2P data channel'],
        ['Online Durum', '\u00c7evrimi\u00e7i g\u00f6stergesi', 'PeerJS heartbeat'],
        ['Okundu', 'Mesaj okundu bilgisi', 'P2P ack mesaj\u0131'],
        ['Engel+Rapor', 'G\u00fcvenlik mekanizmas\u0131', 'Client + DB raporlama'],
        ['K\u00fcf\u00fcr Filtre', 'Otomatik filtre', 'Client-side regex'],
    ], [W*0.17, W*0.38, W*0.45]))
    S.append(Spacer(1, 8))

    S.append(Paragraph("Performans Metrikleri", h2))
    S.append(tbl([
        ['Metrik', 'De\u011fer', 'Not'],
        ['Uygulama Ba\u015flatma', '<2 sn', 'Electron cold start'],
        ['P2P Ba\u011flant\u0131', '<3 sn', 'STUN NAT traversal'],
        ['Video Latency', '<500ms', '720p WebRTC'],
        ['DM \u0130letim', '<100ms', 'P2P (online)'],
        ['Senkronizasyon', '<200ms', 'Play/pause/seek'],
        ['RAM', '180-250 MB', 'Electron + 1 stream'],
        ['Maks. Peer', '4-6 (mesh)', 'SFU ile 50+ hedef'],
    ], [W*0.25, W*0.2, W*0.55]))
    S.append(PageBreak())

    # =========== 4. HEDEF KİTLE ===========
    S.append(Paragraph("4. Hedef Kitle ve Pazar Analizi", h1))
    S.append(Paragraph("Birincil Hedef Kitle", h2))
    for a in [
        "<b>Dating Arayan Gen\u00e7ler (18-28):</b> "
        "Film izleyerek do\u011fal tan\u0131\u015fma ortam\u0131.",
        "<b>Uzun Mesafe \u0130li\u015fkiler (LDR):</b> "
        "Global ~14M LDR \u00e7ift.",
        "<b>Gen-Z \u00c7iftler:</b> "
        "Dijital native, co-viewing k\u00fclt\u00fcr\u00fc.",
        "<b>Arkada\u015f Gruplar\u0131:</b> "
        "2-4 ki\u015fi watch party.",
    ]:
        S.append(Paragraph("\u2022 " + a, bul))

    S.append(Paragraph("Co\u011frafi \u00d6ncelik", h2))
    S.append(tbl([
        ['B\u00f6lge', '\u00d6nc.', 'Neden', 'Kanal'],
        ['T\u00fcrkiye', '\u2b50', '\u00dcni. LDR, T\u00fcrk\u00e7e', 'IG, TikTok, Kamp\u00fcs'],
        ['Almanya', '\u2b50', 'T\u00fcrk diasporas\u0131', 'T\u00fcrk-Alman topluluklar\u0131'],
        ['ABD/Kanada', '2.', 'Dating pazar\u0131', 'Reddit, Product Hunt'],
        ['\u0130sp./Fransa', '2.', 'Dil, Erasmus', 'Erasmus topluluklar\u0131'],
    ], [W*0.14, W*0.08, W*0.35, W*0.43]))

    S.append(Paragraph("Rakip Kar\u015f\u0131la\u015ft\u0131rma", h2))
    S.append(Image(create_market_chart(), width=13*cm, height=6.5*cm))
    feat = [
        ['\u00d6zellik', 'Teleparty', 'Rave', 'Kosmi', 'Scener', "Let's Watch"],
        ['Watch&Date', '\u274c', '\u274c', '\u274c', '\u274c', '\u2705'],
        ['DM Sistemi', '\u274c', '\u274c', '\u274c', '\u274c', '\u2705'],
        ['Lokal P2P', '\u274c', '\u274c', '\u274c', '\u274c', '\u2705'],
        ['AI Dan\u0131\u015fman', '\u274c', '\u274c', '\u274c', '\u274c', '\u2705'],
        ['Couple Mode', '\u274c', '\u274c', '\u274c', '\u274c', '\u2705'],
        ['Screen Share', '\u274c', '\u274c', '\u2705', '\u2705', '\u2705'],
        ['Desktop App', '\u274c', '\u274c', '\u274c', '\u274c', '\u2705'],
        ['Mood Theme', '\u274c', '\u274c', '\u274c', '\u274c', '\u2705'],
        ['5+ Dil', '\u274c', 'Az', '\u274c', '\u274c', '\u2705'],
        ['A\u00e7\u0131k Kaynak', '\u274c', '\u274c', '\u274c', '\u274c', '\u2705'],
    ]
    ft = Table(feat, colWidths=[W*0.2, W*0.15, W*0.13, W*0.13, W*0.15, W*0.24])
    ft.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),DRK),('TEXTCOLOR',(0,0),(-1,0),white),
        ('FONTNAME',(0,0),(-1,0),'SegoeBd'),('FONTNAME',(0,1),(-1,-1),'Segoe'),
        ('FONTSIZE',(0,0),(-1,-1),7.5),('ALIGN',(1,0),(-1,-1),'CENTER'),
        ('BACKGROUND',(-1,1),(-1,-1),HexColor('#FFF3E0')),
        ('INNERGRID',(0,0),(-1,-1),0.25,HexColor('#dee2e6')),
        ('BOX',(0,0),(-1,-1),0.5,DRK),
        ('LEFTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),3),
        ('BOTTOMPADDING',(0,0),(-1,-1),3),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[HexColor('#fff'),LBG]),
    ]))
    S.append(ft)
    S.append(PageBreak())

    # =========== 5. GELİR & ÖDEME ===========
    S.append(Paragraph("5. Gelir Modeli, \u00d6deme Sistemi ve B\u00fct\u00e7e", h1))
    S.append(Image(create_revenue_chart(), width=12*cm, height=6.5*cm))
    S.append(Spacer(1, 4))

    S.append(Paragraph("Gelir Kanallar\u0131", h2))
    S.append(tbl([
        ['Kanal', 'Nas\u0131l \u00c7al\u0131\u015f\u0131r', 'Tahmini (10K user)'],
        ['Oda Boost',
         '$0.99-2.99 \u00f6de, ke\u015ffette \u00fcste \u00e7\u0131k',
         '$300-600/ay'],
        ['Ba\u015fvuru Boost',
         '\u00dccretsiz 3/g\u00fcn. $1.99 ile s\u0131n\u0131rs\u0131z',
         '$200-400/ay'],
        ['Premium ($2.99/ay)',
         'HD, s\u0131n\u0131rs\u0131z oda, temalar, reklams\u0131z',
         '$300-600/ay'],
        ['Rewarded Ads',
         '30sn izle = 1 boost veya 3 ba\u015fvuru',
         '$200-400/ay'],
        ['Banner Ads',
         'Dashboard + bekleme ekran\u0131 (AdMob)',
         '$100-200/ay'],
        ['Tema Market',
         '$0.99-1.99 tema/emoji paketi',
         '$50-150/ay'],
    ], [W*0.17, W*0.50, W*0.33]))
    S.append(Spacer(1, 6))

    S.append(Paragraph("\u00d6deme Sistemi (Katmanl\u0131)", h2))
    S.append(Paragraph(
        "Her platform i\u00e7in en uygun \u00f6deme y\u00f6ntemi kullan\u0131l\u0131r. "
        "Desktop'ta store komisyonu olmad\u0131\u011f\u0131 i\u00e7in kullan\u0131c\u0131lar "
        "desktop \u00f6demesine y\u00f6nlendirilir.", body))
    S.append(tbl([
        ['Platform', '\u00d6deme Y\u00f6ntemi', 'Komisyon', 'Neden'],
        ['iOS (Mobil)',
         'Apple In-App Purchase',
         '%30',
         'Apple zorunlu k\u0131l\u0131yor, ba\u015fka se\u00e7enek yok'],
        ['Android (Mobil)',
         'Google Play Billing',
         '%15 (ilk $1M)',
         'Google zorunlu, ilk $1M\'e kadar %15'],
        ['Desktop (Electron)',
         'Iyzico (TR) + Stripe (Global)',
         '%2.5-2.9',
         'Store komisyonu yok! En karl\u0131 kanal'],
        ['Website',
         'Iyzico (TR) + Stripe (Global)',
         '%2.5-2.9',
         'Web\'de store k\u0131s\u0131t\u0131 yok'],
    ], [W*0.15, W*0.25, W*0.12, W*0.48]))
    S.append(Spacer(1, 4))

    S.append(Paragraph("Neden Iyzico + Stripe?", h3))
    for x in [
        "<b>Iyzico:</b> T\u00fcrk \u015firketi. TL, BKM Express, "
        "yerel kartlar. T\u00fcrkiye pazar\u0131 i\u00e7in zorunlu.",
        "<b>Stripe:</b> 135+ \u00fclke, USD/EUR, en iyi "
        "geli\u015ftirici API. Global pazar i\u00e7in ideal.",
        "<b>Komisyon kar\u015f\u0131la\u015ft\u0131rmas\u0131:</b> $2.99 boost \u2192 "
        "Apple'da $2.09 kal\u0131r, Iyzico'da $2.84 kal\u0131r. "
        "<b>Desktop %36 daha karl\u0131.</b>",
        "<b>Reklam stratejisi:</b> Film / DM s\u0131ras\u0131nda "
        "reklam YOK. Sadece dashboard ve bekleme ekranlar\u0131.",
    ]:
        S.append(Paragraph("\u2022 " + x, bul))
    S.append(Spacer(1, 4))

    S.append(Paragraph("Sunucu (Website DB) Rolleri", h2))
    S.append(Paragraph(
        "Odalar ve e\u015fle\u015fme P2P \u00fczerinden sunucusuz \u00e7al\u0131\u015f\u0131r. "
        "Sunucu sadece a\u015fa\u011f\u0131daki ama\u00e7lar i\u00e7in kullan\u0131l\u0131r:", body))
    S.append(tbl([
        ['Rol', 'A\u00e7\u0131klama', '\u00d6rnekler'],
        ['Kullan\u0131c\u0131 Kay\u0131t', 'Profil ve do\u011frulama', 'isim, ya\u015f, tercihler'],
        ['Analitik', 'Davran\u0131\u015f izleme', 'DAU, match oran\u0131, pop\u00fcler t\u00fcrler'],
        ['Reklam', 'AdMob config', 'g\u00f6sterim, t\u0131klama, gelir'],
        ['\u00d6deme', 'Boost/premium kayıt', 'i\u015flem ID, tutar, tarih'],
        ['Oda Index', 'Ke\u015ffet listesi', 'oda ID, filtreler, boost'],
        ['G\u00fcvenlik', 'Engel ve \u015fikayet', 'rapor eden/lanan, sebep'],
        ['Bildirim', 'Push g\u00f6nderimi', 'ba\u015fvuru, DM, match'],
    ], [W*0.15, W*0.38, W*0.47]))

    S.append(Paragraph("B\u00fct\u00e7e Plan\u0131", h2))
    S.append(tbl([
        ['Kalem', 'Ayl\u0131k', '6 Ay', 'Not'],
        ['Web Hosting + DB', '$0-5', '$0-30', 'Vercel + PlanetScale \u00fccretsiz'],
        ['TURN Server', '$10', '$60', 'Hetzner VPS'],
        ['Domain + SSL', '$1', '$6', '.com'],
        ['App Store', '\u2014', '$125', 'Google $25 + Apple $99'],
        ['Reklam', '$50-100', '$300-600', 'TikTok/IG hedefli'],
        ['Influencer', '$20', '$120', 'Mikro-inf. i\u015fbirli\u011fi'],
        ['TOPLAM', '$81-136', '$611-941', ''],
    ], [W*0.22, W*0.14, W*0.14, W*0.50]))
    S.append(PageBreak())

    # =========== 6. TEKNOLOJİLER ===========
    S.append(Paragraph("6. Teknolojiler ve Mimari", h1))
    S.append(Image(create_tech_stack_chart(), width=12*cm, height=6.5*cm))
    S.append(Spacer(1, 4))
    S.append(tbl([
        ['Teknoloji', 'Kullan\u0131m'],
        ['Electron v39', 'Desktop wrapper, dosya eri\u015fimi'],
        ['React 18', 'UI, SPA, component mimarisi'],
        ['React Native (Expo)', 'Mobil (iOS + Android)'],
        ['Next.js', 'Website + API routes + DB'],
        ['PeerJS (WebRTC)', 'P2P stream + DM + oda'],
        ['Website DB (MySQL)', 'User, analitik, \u00f6deme, oda index'],
        ['Gemini AI', 'Film \u00f6neri, sohbet \u00f6nerisi'],
        ['AdMob', 'Reklam (mobil + desktop)'],
        ['Iyzico + Stripe', '\u00d6deme (TR + global)'],
        ['Nodemailer + Push', 'Email OTP + bildirim'],
    ], [W*0.3, W*0.7]))
    S.append(Spacer(1, 8))

    S.append(Paragraph("Sistem Mimarisi", h2))
    S.append(Image(create_architecture_chart(), width=15.5*cm, height=10.5*cm))
    for d in [
        "<b>P2P-First:</b> Video, chat, DM, senkronizasyon "
        "sunucusuz. Sunucu sadece veri takibi.",
        "<b>Website DB:</b> Profil, oda index, \u00f6deme, reklam, "
        "analitik. API routes ile eri\u015fim.",
        "<b>Hibrit Ke\u015fif:</b> Oda listesi DB'den (h\u0131zl\u0131), "
        "ba\u011flant\u0131 P2P'den (sunucusuz).",
        "<b>Katmanl\u0131 \u00d6deme:</b> Mobil=IAP, Desktop/Web=Iyzico+Stripe.",
    ]:
        S.append(Paragraph("\u2022 " + d, bul))
    S.append(PageBreak())

    # =========== 7. İŞ DAĞILIMI ===========
    S.append(Paragraph("7. \u0130\u015f Da\u011f\u0131l\u0131m\u0131 ve Yol Haritas\u0131", h1))
    S.append(Paragraph(
        "Ba\u015flang\u0131\u00e7: 13 \u015eubat 2026 | Her task: 3 g\u00fcn | "
        "Biti\u015f k\u0131s\u0131t\u0131 yok | 3 ki\u015fi, 9 sprint", sub))
    S.append(Image(create_gantt_chart(), width=15.5*cm, height=14.5*cm))
    S.append(PageBreak())

    # Sprint tablosu - 9 sprint, tutarlı, dengeli, uygulanabilir
    sprint = [
        ['Sprint', 'Talha Ka\u011fan Tosun\n(Lead / Backend / Infra)',
         'Ege Ceylan\n(Frontend / Web / Mobil)',
         'Deniz Eren Bozkurt\n(QA / Extension / AI)'],
        ['S1\n13-15\n\u015eub',
         '\u2022 PeerJS signaling config\n'
         '\u2022 P2P oda yay\u0131n mant\u0131\u011f\u0131\n'
         '\u2022 Ba\u011flant\u0131 test ortam\u0131',
         '\u2022 \u0130ndirme sitesi (Next.js)\n'
         '\u2022 DB \u015femas\u0131: users, rooms\n'
         '\u2022 Vercel deploy + API route',
         '\u2022 Chrome Ext. manifest v3\n'
         '\u2022 Side panel temel yap\u0131\n'
         '\u2022 Extension-app ileti\u015fimi'],
        ['S2\n16-18\n\u015eub',
         '\u2022 STUN/TURN (Coturn) setup\n'
         '\u2022 NAT traversal test\n'
         '\u2022 Connection diagnostic',
         '\u2022 Onboarding UI redesign\n'
         '\u2022 Cinsiyet/ya\u015f/t\u00fcr formu\n'
         '\u2022 Profil DB kayıt API',
         '\u2022 AI dan\u0131\u015fman prompt engine\n'
         '\u2022 Film \u00f6neri motoru\n'
         '\u2022 Sohbet \u00f6neri modu'],
        ['S3\n19-21\n\u015eub',
         '\u2022 Match API: oda CRUD\n'
         '\u2022 Filtre + arama endpoint\n'
         '\u2022 Ba\u015fvuru kabul/red API',
         '\u2022 Ke\u015ffet sayfas\u0131 UI\n'
         '\u2022 Oda kartlar\u0131 + filtre panel\n'
         '\u2022 Ba\u015fvuru formu UI',
         '\u2022 DM: P2P data channel\n'
         '\u2022 Mesaj localStorage\n'
         '\u2022 Yaz\u0131yor/okundu g\u00f6sterge'],
        ['S4\n22-24\n\u015eub',
         '\u2022 \u00d6deme: Iyzico + Stripe\n'
         '\u2022 Boost mant\u0131\u011f\u0131 backend\n'
         '\u2022 Ba\u015fvuru limiti (3/g\u00fcn)',
         '\u2022 DM chat UI (1:1)\n'
         '\u2022 Online/offline + bildirim\n'
         '\u2022 Engel/rapor UI',
         '\u2022 Mood theme engine\n'
         '\u2022 T\u00fcre g\u00f6re tema mant\u0131\u011f\u0131\n'
         '\u2022 Reaction overlay'],
        ['S5\n25-27\n\u015eub',
         '\u2022 Screen share + kalite\n'
         '\u2022 720p/1080p bandwidth\n'
         '\u2022 Multi-peer mesh test',
         '\u2022 Room Cinema Mode UI\n'
         '\u2022 Emoji picker + animasyon\n'
         '\u2022 Couple mode UI',
         '\u2022 i18n QA (5 dil)\n'
         '\u2022 E2E: match + DM ak\u0131\u015f\u0131\n'
         '\u2022 Boost/ba\u015fvuru testleri'],
        ['S6\n28\u015eub\n-2Mar',
         '\u2022 Electron build (Win+Linux)\n'
         '\u2022 Auto-update config\n'
         '\u2022 NSIS installer',
         '\u2022 Website SEO optimize\n'
         '\u2022 Analytics entegrasyonu\n'
         '\u2022 Store screenshot haz\u0131rl\u0131k',
         '\u2022 AdMob SDK entegrasyon\n'
         '\u2022 Rewarded ad \u2192 boost\n'
         '\u2022 Banner yerle\u015fim test'],
        ['S7\n3-5\nMar',
         '\u2022 CI/CD (GitHub Actions)\n'
         '\u2022 Auto-release pipeline\n'
         '\u2022 Backend deploy otomasyon',
         '\u2022 React Native mobil init\n'
         '\u2022 Auth + onboarding mobil\n'
         '\u2022 Navigation yap\u0131s\u0131',
         '\u2022 Admin panel + tracking\n'
         '\u2022 Analitik: DAU, match %\n'
         '\u2022 G\u00fcvenlik audit'],
        ['S8\n6-8\nMar',
         '\u2022 Beta release + Sentry\n'
         '\u2022 Error monitoring\n'
         '\u2022 Load test (Match API)',
         '\u2022 Mobil: ke\u015ffet+DM+room\n'
         '\u2022 Push notification\n'
         '\u2022 Responsive polish',
         '\u2022 Premium feature flags\n'
         '\u2022 Couple mode backend\n'
         '\u2022 Payla\u015f\u0131lan liste'],
        ['S9\n9-12\nMar',
         '\u2022 v2.0 RC + prod deploy\n'
         '\u2022 Monitoring dashboard\n'
         '\u2022 Hotfix s\u00fcreci kurma',
         '\u2022 Mobil finalize + store\n'
         '\u2022 Tan\u0131t\u0131m video + PR\n'
         '\u2022 Product Hunt haz\u0131rl\u0131k',
         '\u2022 Store submission\n'
         '\u2022 Yasal/lisans kontrol\n'
         '\u2022 Dok\u00fcmantasyon'],
    ]
    st = Table(sprint, colWidths=[W*0.08, W*0.31, W*0.31, W*0.30])
    st.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),DRK),('TEXTCOLOR',(0,0),(-1,0),white),
        ('FONTNAME',(0,0),(-1,0),'SegoeBd'),('FONTNAME',(0,1),(-1,-1),'Segoe'),
        ('FONTSIZE',(0,0),(-1,0),7),('FONTSIZE',(0,1),(-1,-1),6.5),
        ('LEADING',(0,1),(-1,-1),8.5),
        ('BACKGROUND',(0,1),(0,-1),HexColor('#f0f0f0')),('FONTNAME',(0,1),(0,-1),'SegoeBd'),
        ('FONTSIZE',(0,1),(0,-1),6.5),
        ('BACKGROUND',(1,1),(1,-1),HexColor('#FFF8F0')),
        ('BACKGROUND',(2,1),(2,-1),HexColor('#F0F6FF')),
        ('BACKGROUND',(3,1),(3,-1),HexColor('#F0FFF4')),
        ('INNERGRID',(0,0),(-1,-1),0.25,HexColor('#dee2e6')),
        ('BOX',(0,0),(-1,-1),0.5,DRK),
        ('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),4),
        ('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
    ]))
    S.append(st)
    S.append(Spacer(1, 6))
    S.append(Paragraph("<b>Neden bu plan \u00e7al\u0131\u015f\u0131r:</b>", body))
    for x in [
        "<b>Ba\u011f\u0131ml\u0131l\u0131k s\u0131ras\u0131 do\u011fru:</b> "
        "S1 altyap\u0131 \u2192 S2 NAT+AI \u2192 S3 match+DM (core) \u2192 "
        "S4 \u00f6deme+UI \u2192 S5 kalite \u2192 S6 build \u2192 S7 mobil+CI \u2192 "
        "S8 beta \u2192 S9 release.",
        "<b>Paralel \u00e7al\u0131\u015fma:</b> Her sprint'te 3 ki\u015fi "
        "ba\u011f\u0131ms\u0131z i\u015f yapar, birbirini beklemez.",
        "<b>Dengeli y\u00fck:</b> Talha=infra+backend, "
        "Ege=UI+web+mobil, Deniz=QA+AI+extension. "
        "Herkes kendi alan\u0131nda.",
        "<b>Test i\u00e7 i\u00e7e:</b> Deniz her sprint'te test yapar, "
        "S5 ve S9'da tam regression.",
    ]:
        S.append(Paragraph("\u2022 " + x, bul))
    S.append(PageBreak())

    # =========== 8. TEKNİK HUSUSLAR ===========
    S.append(Paragraph("8. Teknik Hususlar", h1))
    S.append(Paragraph("G\u00fcvenlik", h2))
    for x in [
        "<b>WebRTC SRTP:</b> Video ve DM \u015fifreli.",
        "<b>Context Isolation:</b> Electron XSS korumas\u0131.",
        "<b>DM:</b> Profanity filter, engel, rapor. KVKK uyumu.",
        "<b>Match:</b> Rate limit, sahte profil tespiti, spam koruma.",
        "<b>\u00d6deme:</b> Iyzico/Stripe PCI DSS uyumlu. "
        "Kart bilgisi sunucuda saklanmaz.",
    ]:
        S.append(Paragraph("\u2022 " + x, bul))

    S.append(Paragraph("Performans", h2))
    for x in [
        "<b>TURN:</b> Symmetric NAT i\u00e7in zorunlu altyap\u0131.",
        "<b>Upload:</b> 720p min 3 Mbps. Kullan\u0131c\u0131ya uyar\u0131.",
        "<b>DB Latency:</b> Oda listesi <200ms (edge functions).",
        "<b>DM:</b> Online <100ms (P2P), offline store-and-forward.",
    ]:
        S.append(Paragraph("\u2022 " + x, bul))

    S.append(Paragraph("Geli\u015ftirme", h2))
    for x in [
        "<b>Vibe Coding:</b> AI destekli h\u0131zl\u0131 geli\u015ftirme.",
        "<b>Component:</b> Her biri JSX+CSS \u00e7ifti.",
        "<b>i18n:</b> T\u00fcm text translation.json'dan.",
        "<b>Git Flow:</b> Feature branch \u2192 PR \u2192 main.",
    ]:
        S.append(Paragraph("\u2022 " + x, bul))
    S.append(PageBreak())

    # =========== 9. LANSMAN SONRASI ===========
    S.append(Paragraph("9. Lansman Sonras\u0131 Plan", h1))
    S.append(Image(create_post_launch_chart(), width=13*cm, height=6.5*cm))
    S.append(Spacer(1, 4))
    for x in [
        "<b>Mart \u2013 Beta:</b> Product Hunt, Reddit. "
        "Match beta. Website canl\u0131.",
        "<b>Nisan \u2013 Topluluk:</b> Discord, DM v2, "
        "Couple Mode v1.",
        "<b>May\u0131s \u2013 v2.5:</b> Subtitle, playlist, "
        "tema marketplace.",
        "<b>Haziran \u2013 Mobil:</b> App Store + Play Store. "
        "AdMob aktif.",
        "<b>Temmuz \u2013 Gelir:</b> Premium tier. "
        "Hedef: $1000+/ay.",
        "<b>A\u011fustos \u2013 \u00d6l\u00e7ek:</b> SFU 50+ ki\u015fi. "
        "Video call DM.",
    ]:
        S.append(Paragraph("\u2022 " + x, bul))

    S.append(Paragraph("PR Plan\u0131", h2))
    for x in [
        "<b>LDR:</b> Reddit r/LongDistance, Facebook gruplar\u0131.",
        "<b>Influencer:</b> TikTok/YouTube LDR \u00e7iftler.",
        "<b>Kamp\u00fcs:</b> Erasmus, \u00fcniversite kul\u00fcpleri.",
        "<b>ASO:</b> \"watch and date\", \"couple app\", "
        "\"long distance\".",
    ]:
        S.append(Paragraph("\u2022 " + x, bul))

    S.append(Spacer(1, 1.5*cm))
    foot = ts('Foot', ss['Normal'], fontSize=8, textColor=GRY, alignment=TA_CENTER)
    S.append(Paragraph("\u2500" * 50, foot))
    S.append(Paragraph(
        "\u00a9 2026 Let's Watch | Talha Ka\u011fan Tosun", foot))

    doc.build(S)
    print(f"PDF olusturuldu: {OUTPUT}")

if __name__ == '__main__':
    build()
