# -*- coding: utf-8 -*-
"""Chart generators for Let's Watch report v6 - Final"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime, timedelta
from io import BytesIO

plt.rcParams['font.size'] = 9

def create_tech_stack_chart():
    fig, ax = plt.subplots(figsize=(5.5, 3.2))
    techs = ['React /\nReact Native', 'Electron', 'PeerJS\nWebRTC', 'Next.js\nVite', 'Gemini AI', 'Website\nDB+API']
    weights = [28, 20, 22, 10, 10, 10]
    colors = ['#61DAFB', '#47848F', '#FF8E53', '#646CFF', '#4285F4', '#e94560']
    wedges, texts, autotexts = ax.pie(weights, labels=techs, autopct='%1.0f%%',
        colors=colors, startangle=90, textprops={'fontsize': 7.5})
    for t in autotexts:
        t.set_fontsize(7); t.set_color('white'); t.set_fontweight('bold')
    ax.set_title('Teknoloji Dagilimi', fontsize=10, fontweight='bold', pad=8)
    plt.tight_layout()
    buf = BytesIO(); fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig); buf.seek(0); return buf

def create_market_chart():
    fig, ax = plt.subplots(figsize=(5.5, 2.8))
    apps = ['Teleparty', 'Rave', 'Kosmi', 'Scener', "Let's Watch\n(Hedef)"]
    users = [10, 5, 0.5, 2, 0.1]
    cs = ['#e63946', '#ff6f00', '#00b4d8', '#9b59b6', '#FF8E53']
    bars = ax.barh(apps, users, color=cs, height=0.55, edgecolor='white', linewidth=0.5)
    ax.set_xlabel('Tahmini Kullanici (Milyon)', fontsize=8)
    ax.set_title('Rakip Kullanici Tabani', fontsize=10, fontweight='bold')
    ax.set_xlim(0, 14)
    for bar, val in zip(bars, users):
        ax.text(bar.get_width() + 0.2, bar.get_y() + bar.get_height()/2,
                f'{val}M', va='center', fontsize=7.5, fontweight='bold')
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    plt.tight_layout()
    buf = BytesIO(); fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig); buf.seek(0); return buf

def create_gantt_chart():
    fig, ax = plt.subplots(figsize=(7.5, 9))
    sd = datetime(2026, 2, 13)
    m = {'Talha': '#FF8E53', 'Ege': '#4285F4', 'Deniz': '#28a745'}
    tasks = [
        ('Talha','PeerJS Signal + P2P Oda',0,3),('Ege','Website+DB Sema+Deploy',0,3),('Deniz','Chrome Ext MVP',0,3),
        ('Talha','STUN/TURN + NAT Test',3,3),('Ege','Onboarding + Profil UI',3,3),('Deniz','AI Advisor Engine',3,3),
        ('Talha','Match API + Oda CRUD',6,3),('Ege','Kesfet/Arama UI',6,3),('Deniz','DM Sistemi P2P',6,3),
        ('Talha','Odeme: Iyzico+Stripe',9,3),('Ege','DM Chat UI + Bildirim',9,3),('Deniz','Mood Theme+Reactions',9,3),
        ('Talha','Screen Share+Quality',12,3),('Ege','Room Cinema Mode',12,3),('Deniz','i18n QA + E2E Test',12,3),
        ('Talha','Electron Build+Update',15,3),('Ege','Website SEO+Analytics',15,3),('Deniz','AdMob Reklam Entgr.',15,3),
        ('Talha','CI/CD + Auto-Release',18,3),('Ege','React Native Mobil',18,3),('Deniz','Admin Panel+Tracking',18,3),
        ('Talha','Beta + Sentry Monitor',21,3),('Ege','Mobil UI Finalize',21,3),('Deniz','Premium+Couple Mode',21,3),
        ('Talha','v2.0 RC + Prod Deploy',24,3),('Ege','PR + Marketing Assets',24,3),('Deniz','Store Submit + Docs',24,3),
    ]
    y = len(tasks) - 1
    for i, (who, name, off, dur) in enumerate(tasks):
        s_d = sd + timedelta(days=off); e_d = s_d + timedelta(days=dur)
        ax.barh(y-i, dur, left=mdates.date2num(s_d), color=m[who], alpha=0.85, height=0.6, edgecolor='white', linewidth=0.5)
        ax.text(mdates.date2num(s_d) + dur/2, y-i, name, ha='center', va='center', fontsize=5, fontweight='bold', color='white')
    ax.set_yticks([y-i for i in range(len(tasks))])
    ax.set_yticklabels([t[0] for t in tasks], fontsize=6)
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%d %b'))
    ax.xaxis.set_major_locator(mdates.DayLocator(interval=3))
    plt.xticks(fontsize=7, rotation=45)
    ax.set_title('Is Dagilimi (13 Subat - 12 Mart)', fontsize=10, fontweight='bold', pad=8)
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    ax.set_xlim(mdates.date2num(sd) - 0.5, mdates.date2num(datetime(2026, 3, 14)))
    from matplotlib.patches import Patch
    ax.legend(handles=[Patch(facecolor=c, label=n) for n, c in m.items()], loc='lower right', fontsize=7)
    plt.tight_layout()
    buf = BytesIO(); fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig); buf.seek(0); return buf

def create_architecture_chart():
    fig, ax = plt.subplots(figsize=(7, 4.8))
    ax.set_xlim(0, 10); ax.set_ylim(0, 8); ax.axis('off')
    boxes = [
        (0.2, 6.5, 2.8, 1, 'Electron Desktop\n(Win / Linux)', '#47848F'),
        (3.4, 6.5, 3.2, 1, 'React Native Mobil\n(iOS / Android)', '#61DAFB'),
        (7, 6.5, 2.8, 1, 'Chrome Extension\n(Side Panel)', '#4285F4'),
        (0.2, 4.8, 4.3, 1, 'PeerJS / WebRTC\n(P2P: Video + Chat + DM + Match)', '#FF8E53'),
        (5, 4.8, 4.8, 1, 'Website DB + API\n(User, Analitik, Odeme, Reklam, Index)', '#e94560'),
        (0.2, 3.1, 2.5, 1, 'PeerJS Cloud\n(Signaling)', '#6c757d'),
        (3, 3.1, 2.5, 1, 'Coturn TURN\n(NAT Traversal)', '#ffc107'),
        (5.8, 3.1, 1.8, 1, 'Gemini AI\n(Dansman)', '#28a745'),
        (0.2, 1.4, 2.5, 1, 'AdMob\n(Reklam)', '#9b59b6'),
        (3, 1.4, 2.5, 1, 'Iyzico+Stripe\n(Odeme)', '#0d6efd'),
        (5.8, 1.4, 1.8, 1, 'Nodemailer\n(Email)', '#333'),
        (7.9, 3.1, 1.9, 1, 'Push API\n(Bildirim)', '#0d6efd'),
        (7.9, 1.4, 1.9, 1, 'GitHub\n(CI/CD)', '#333'),
    ]
    for x, y, w, h, text, color in boxes:
        r = plt.Rectangle((x, y), w, h, facecolor=color, alpha=0.85, edgecolor='white', linewidth=1.5, zorder=2)
        ax.add_patch(r)
        ax.text(x+w/2, y+h/2, text, ha='center', va='center', fontsize=6, fontweight='bold', color='white', zorder=3)
    for x1, y1, x2, y2 in [
        (1.6,6.5,2.3,5.8),(5,6.5,4.3,5.8),(8.4,6.5,7.4,5.8),
        (4.5,5.3,5,5.3),(1.4,4.8,1.4,4.1),(4.2,4.8,4.2,4.1),(6.7,4.8,6.7,4.1),
        (1.4,3.1,1.4,2.4),(4.2,3.1,4.2,2.4),(6.7,3.1,6.7,2.4),
        (8.8,3.1,8.8,2.4),
    ]:
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle='->', color='#aaa', lw=1))
    ax.set_title('Sistem Mimarisi', fontsize=11, fontweight='bold', pad=8)
    plt.tight_layout()
    buf = BytesIO(); fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig); buf.seek(0); return buf

def create_post_launch_chart():
    fig, ax = plt.subplots(figsize=(5.5, 2.8))
    months = ['Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos']
    users = [100, 500, 2000, 5000, 12000, 25000]
    ax.fill_between(range(len(months)), users, alpha=0.3, color='#FF8E53')
    ax.plot(range(len(months)), users, 'o-', color='#FF8E53', linewidth=2, markersize=5)
    for i, v in enumerate(users):
        ax.text(i, v + 800, f'{v:,}', ha='center', fontsize=7.5, fontweight='bold')
    ax.set_xticks(range(len(months))); ax.set_xticklabels(months, fontsize=8)
    ax.set_ylabel('Kullanici', fontsize=8)
    ax.set_title('Hedef Kullanici (Mart-Agustos 2026)', fontsize=10, fontweight='bold')
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    plt.tight_layout()
    buf = BytesIO(); fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig); buf.seek(0); return buf

def create_revenue_chart():
    fig, ax = plt.subplots(figsize=(5.5, 3.2))
    labels = ['Oda+Basvuru\nBoost', 'Premium\nAbonelik', 'Reklam\n(Rewarded)', 'Tema\nMarket']
    sizes = [35, 30, 25, 10]
    colors = ['#FF8E53', '#4285F4', '#9b59b6', '#28a745']
    wedges, texts, autotexts = ax.pie(sizes, explode=(0.04,0.04,0,0), labels=labels, autopct='%1.0f%%',
        colors=colors, startangle=90, textprops={'fontsize': 7.5})
    for t in autotexts:
        t.set_fontsize(7); t.set_color('white'); t.set_fontweight('bold')
    ax.set_title('Hedef Gelir Dagilimi (12. Ay)', fontsize=10, fontweight='bold', pad=8)
    plt.tight_layout()
    buf = BytesIO(); fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig); buf.seek(0); return buf

def create_user_flow_chart():
    fig, ax = plt.subplots(figsize=(7, 3))
    ax.set_xlim(0, 10); ax.set_ylim(0, 3.5); ax.axis('off')
    steps = [
        (0.1,1,1.4,1.4,'Kayit\n+Profil','#4285F4'),
        (1.7,1,1.4,1.4,'Kesfet\n+Filtre','#FF8E53'),
        (3.3,1,1.4,1.4,'Basvur\n/Oda Ac','#e94560'),
        (4.9,1,1.4,1.4,'Kabul\n+DM Ac','#28a745'),
        (6.5,1,1.4,1.4,'DM\nTanisma','#9b59b6'),
        (8.1,1,1.4,1.4,'Watch\n& Date','#FF8E53'),
    ]
    for i,(x,y,w,h,txt,c) in enumerate(steps):
        r = plt.Rectangle((x,y),w,h,facecolor=c,alpha=0.85,edgecolor='white',linewidth=2,zorder=2)
        ax.add_patch(r)
        ax.text(x+w/2,y+h/2,txt,ha='center',va='center',fontsize=8,fontweight='bold',color='white',zorder=3)
        ax.text(x+w/2,y+h+0.12,f'{i+1}',ha='center',fontsize=7,fontweight='bold',color=c)
        if i < len(steps)-1:
            ax.annotate('',xy=(steps[i+1][0]-0.03,y+h/2),xytext=(x+w+0.03,y+h/2),
                arrowprops=dict(arrowstyle='->',color='#333',lw=1.5))
    ax.set_title('Kullanici Akisi', fontsize=10, fontweight='bold', pad=6)
    plt.tight_layout()
    buf = BytesIO(); fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig); buf.seek(0); return buf
