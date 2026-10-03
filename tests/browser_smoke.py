"""Optional browser smoke test. Requires Playwright and system Chromium; no install needed by app."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE = 'http://127.0.0.1:4173/spacetime-train-app/'
KEY = 'spacetime-train-prototype-v1'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440,'height':1100}, device_scale_factor=1)
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE)
    page.get_by_role('heading',name='探索终端').wait_for()
    assert page.locator('#bag-grid button').count()==2
    page.screenshot(path='outputs/desktop.png', full_page=True)
    # Item action, dialog dismissal, state persistence.
    page.locator('#bag-grid button').first.click()
    page.get_by_role('button',name='转移到主仓库',exact=True).click()
    assert page.locator('#bag-grid button').count()==1
    page.reload()
    assert page.locator('#bag-grid button').count()==1
    page.get_by_role('button',name='玩法与边界').click()
    page.keyboard.press('Escape')
    assert not page.locator('#help-dialog').is_visible()
    page.get_by_role('button',name='重置存档').click()
    page.get_by_role('button',name='继续当前旅程').click()
    assert page.locator('#bag-grid button').count()==1
    # Reset and feed independent machine.
    page.get_by_role('button',name='重置存档').click()
    page.get_by_role('button',name='清除并重置').click()
    assert page.locator('#bag-grid button').count()==2
    page.locator('[data-feed=farm]').click()
    assert json.loads(page.evaluate(f'localStorage.getItem("{KEY}")'))['machines']['farm']['input']==1
    # Start, refresh mid-expedition, complete automated expedition.
    page.get_by_role('button',name='准备就绪，出发').click()
    assert page.locator('#journey').is_visible()
    assert page.locator('#bag-grid button:enabled').count()==0
    page.wait_for_timeout(3100)
    page.reload()
    assert page.locator('#journey').is_visible()
    page.wait_for_function(f'JSON.parse(localStorage.getItem("{KEY}")).phase === "base"', timeout=21000)
    result=json.loads(page.evaluate(f'localStorage.getItem("{KEY}")'))
    assert result['runs']==1
    assert result['machines']['farm']['output']==3
    page.locator('[data-collect=farm]').click()
    assert json.loads(page.evaluate(f'localStorage.getItem("{KEY}")'))['machines']['farm']['output']==2
    page.screenshot(path='outputs/after-expedition.png', full_page=True)
    # Corrupt saved state falls back safely; no script evaluation.
    page.evaluate(f'localStorage.setItem("{KEY}","bad json")')
    page.reload()
    assert page.locator('#bag-grid button').count()==2
    # Mobile tap transfer and responsive overflow.
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path='outputs/mobile.png',full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.locator('#bag-grid button').first.click()
    page.get_by_role('button',name='转移到主仓库',exact=True).click()
    assert page.locator('#bag-grid button').count()==1
    assert not errors, errors
    # Blocked localStorage still yields a playable session.
    blocked=browser.new_context(viewport={'width':390,'height':844})
    blocked.add_init_script("Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage unavailable'); } });")
    bpage=blocked.new_page(); bpage.goto(BASE)
    bpage.get_by_role('button',name='准备就绪，出发').click()
    assert bpage.locator('#journey').is_visible()
    assert '存储不可用' in bpage.locator('#save-status').inner_text()
    browser.close()
    print('PASS: desktop/mobile, item transfer, persistence, dialog cancel, reset, production, autonomous expedition, interrupted reload, corrupt save, blocked storage; zero browser errors.')
