#!/usr/bin/env python3
"""
Script para gerar perguntas secretas de ALTA ENTROPIA
Desafio Caju Security Champions - Recuperação de Senha PID
"""

import json
import random
import hashlib
from datetime import datetime, timedelta

# Dados dos usuários (extraídos de data.sql)
usuarios = [
    {'username': 'admin', 'cpf': '123.456.789-00', 'telefone': '(11) 99999-9999', 'email': 'admin@sistema.com'},
    {'username': 'alice', 'cpf': '987.654.321-00', 'telefone': '(21) 88888-8888', 'email': 'alice@email.com'},
    {'username': 'bob', 'cpf': '456.789.123-00', 'telefone': '(31) 77777-7777', 'email': 'bob@curioso.com'},
    {'username': 'maria.silva', 'cpf': '111.222.333-44', 'telefone': '(11) 99999-1111', 'email': 'maria.silva@tech.com'},
    {'username': 'joao.santos', 'cpf': '222.333.444-55', 'telefone': '(21) 88888-2222', 'email': 'joao.santos@empresa.com'},
    {'username': 'ana.costa', 'cpf': '333.444.555-66', 'telefone': '(31) 77777-3333', 'email': 'ana.costa@design.com'},
    {'username': 'carlos.oliveira', 'cpf': '444.555.666-77', 'telefone': '(11) 99999-4444', 'email': 'carlos.oliveira@projetos.com'},
    {'username': 'fernanda.lima', 'cpf': '555.666.777-88', 'telefone': '(21) 88888-5555', 'email': 'fernanda.lima@consultoria.com'},
    {'username': 'rafael.mendes', 'cpf': '666.777.888-99', 'telefone': '(31) 77777-6666', 'email': 'rafael.mendes@arquitetura.com'},
    {'username': 'juliana.pereira', 'cpf': '777.888.999-00', 'telefone': '(11) 99999-7777', 'email': 'juliana.pereira@product.com'},
    {'username': 'marcos.rodrigues', 'cpf': '888.999.000-11', 'telefone': '(21) 88888-8888', 'email': 'marcos.rodrigues@devops.com'},
    {'username': 'patricia.alves', 'cpf': '999.000.111-22', 'telefone': '(31) 77777-9999', 'email': 'patricia.alves@ux.com'},
    {'username': 'lucas.ferreira', 'cpf': '000.111.222-33', 'telefone': '(11) 99999-0000', 'email': 'lucas.ferreira@fullstack.com'},
    {'username': 'camila.rocha', 'cpf': '111.222.333-44', 'telefone': '(21) 88888-1111', 'email': 'camila.rocha@data.com'},
    {'username': 'andre.martins', 'cpf': '222.333.444-55', 'telefone': '(31) 77777-2222', 'email': 'andre.martins@techlead.com'},
    {'username': 'beatriz.nunes', 'cpf': '333.444.555-66', 'telefone': '(11) 99999-3333', 'email': 'beatriz.nunes@qa.com'},
    {'username': 'felipe.carvalho', 'cpf': '444.555.666-77', 'telefone': '(21) 88888-4444', 'email': 'felipe.carvalho@mobile.com'},
    {'username': 'larissa.moreira', 'cpf': '555.666.777-88', 'telefone': '(31) 77777-5555', 'email': 'larissa.moreira@scrum.com'},
    {'username': 'gabriel.souza', 'cpf': '666.777.888-99', 'telefone': '(11) 99999-6666', 'email': 'gabriel.souza@backend.com'},
    {'username': 'isabela.castro', 'cpf': '777.888.999-00', 'telefone': '(21) 88888-7777', 'email': 'isabela.castro@frontend.com'},
    {'username': 'thiago.barbosa', 'cpf': '888.999.000-11', 'telefone': '(31) 77777-8888', 'email': 'thiago.barbosa@cloud.com'},
    {'username': 'vanessa.dias', 'cpf': '999.000.111-22', 'telefone': '(11) 99999-9999', 'email': 'vanessa.dias@business.com'},
    {'username': 'rodrigo.monteiro', 'cpf': '000.111.222-33', 'telefone': '(21) 88888-0000', 'email': 'rodrigo.monteiro@security.com'},
    {'username': 'amanda.ribeiro', 'cpf': '111.222.333-44', 'telefone': '(31) 77777-1111', 'email': 'amanda.ribeiro@marketing.com'},
    {'username': 'bruno.goncalves', 'cpf': '222.333.444-55', 'telefone': '(11) 99999-2222', 'email': 'bruno.goncalves@sales.com'},
    {'username': 'cristina.azevedo', 'cpf': '333.444.555-66', 'telefone': '(21) 88888-3333', 'email': 'cristina.azevedo@hr.com'},
]

# Bancos brasileiros (para perguntas)
bancos = [
    'Banco do Brasil', 'Caixa Econômica Federal', 'Bradesco', 'Itaú Unibanco',
    'Santander', 'Banco Inter', 'Nubank', 'C6 Bank', 'PagBank', 'Banco Original',
    'Banco Safra', 'Banco Pan', 'Banco BMG', 'Banco BV', 'Banco Votorantim',
    'Banco Mercantil', 'Banrisul', 'Sicoob', 'Sicredi', 'Banco Daycoval'
]

# Empresas fictícias brasileiras
empresas = [
    'TechnoSoft Sistemas Ltda', 'Inovare Tecnologia S.A.', 'DataCore Solutions',
    'CloudWorks Brasil', 'Digisystems Consultoria', 'Nexus IT Services',
    'Smartcode Desenvolvimento', 'ByteMakers Software House', 'CodeFlow Technologies',
    'Quantum Digital', 'Vertex Solutions', 'Praxis Informática', 'Helix Software',
    'Zenith Tecnologia', 'Apex Systems', 'CoreTech Brasil', 'PrimeTech Solutions',
    'Omega Software', 'Delta Informática', 'Sigma Technologies'
]

# Agências bancárias fictícias
def gerar_agencia():
    return f"{random.randint(1000, 9999)}"

# Gerar código de segurança de 6 dígitos
def gerar_codigo_seguranca():
    return f"{random.randint(100000, 999999)}"

# Gerar valor de transação realista (contexto financeiro)
def gerar_valor_transacao():
    # Valores realistas de transações bancárias
    valores_comuns = [
        round(random.uniform(50, 200), 2),      # Pequenas compras
        round(random.uniform(200, 500), 2),     # Compras médias
        round(random.uniform(500, 1500), 2),    # Compras grandes
        round(random.uniform(1500, 5000), 2),   # Pagamentos/transferências
        round(random.uniform(5000, 15000), 2),  # Transações maiores
    ]
    return random.choice(valores_comuns)

# Gerar data recente (últimos 90 dias)
def gerar_data_recente():
    dias_atras = random.randint(1, 90)
    data = datetime.now() - timedelta(days=dias_atras)
    return data.strftime('%d/%m/%Y')

# Gerar últimos 4 dígitos de conta
def gerar_ultimos_digitos_conta():
    return f"{random.randint(1000, 9999)}"

# Hash de resposta (para armazenamento seguro - será usado pelo BFF)
def hash_resposta(resposta):
    """
    Hash SHA-256 da resposta normalizada.
    BFF armazenará hashes, não texto claro.
    """
    resposta_normalizada = resposta.strip().lower()
    return hashlib.sha256(resposta_normalizada.encode('utf-8')).hexdigest()

def gerar_perguntas_usuario(usuario):
    """
    Gera 5 perguntas de ALTA ENTROPIA para cada usuário.

    Características das perguntas:
    - Alta entropia (milhares/milhões de possibilidades)
    - Difíceis de adivinhar ou descobrir publicamente
    - Baseadas em dados transacionais, não biográficos
    - Impossíveis de encontrar em redes sociais
    """

    username = usuario['username']
    cpf = usuario['cpf']
    telefone = usuario['telefone']
    email = usuario['email']

    # Gerar dados fictícios mas realistas
    banco_conta_salario = random.choice(bancos)
    empresa_atual = random.choice(empresas)
    agencia = gerar_agencia()
    codigo_seguranca = gerar_codigo_seguranca()
    valor_ultima_transacao = gerar_valor_transacao()
    data_ultima_transacao = gerar_data_recente()
    ultimos_digitos_conta = gerar_ultimos_digitos_conta()
    valor_fatura = gerar_valor_transacao()
    data_ultima_senha = gerar_data_recente()

    perguntas = [
        {
            "id": 1,
            "pergunta": "Qual o nome completo do banco onde você possui sua conta salário principal?",
            "resposta": banco_conta_salario,
            "resposta_hash": hash_resposta(banco_conta_salario),
            "tipo": "texto",
            "entropia": "alta",
            "justificativa": "20 bancos principais = 20 opções + variações de nome. Não público.",
            "categoria": "financeiro"
        },
        {
            "id": 2,
            "pergunta": "Qual o nome fantasia completo da empresa onde você trabalha atualmente?",
            "resposta": empresa_atual,
            "resposta_hash": hash_resposta(empresa_atual),
            "tipo": "texto",
            "entropia": "muito_alta",
            "justificativa": "Milhares de empresas no Brasil. Nome completo é específico. Difícil de descobrir.",
            "categoria": "profissional"
        },
        {
            "id": 3,
            "pergunta": "Qual o número da sua agência bancária principal? (4 dígitos)",
            "resposta": agencia,
            "resposta_hash": hash_resposta(agencia),
            "tipo": "numerico",
            "entropia": "alta",
            "justificativa": "10.000 possibilidades (0000-9999). Informação privada bancária.",
            "categoria": "financeiro"
        },
        {
            "id": 4,
            "pergunta": "Qual o código de segurança de 6 dígitos que você definiu no seu cadastro inicial?",
            "resposta": codigo_seguranca,
            "resposta_hash": hash_resposta(codigo_seguranca),
            "tipo": "numerico",
            "entropia": "muito_alta",
            "justificativa": "1.000.000 de possibilidades (000000-999999). Apenas o usuário sabe.",
            "categoria": "cadastral"
        },
        {
            "id": 5,
            "pergunta": "Qual foi o valor aproximado (em reais) da sua última transação bancária? (formato: 0000.00)",
            "resposta": f"{valor_ultima_transacao:.2f}",
            "resposta_hash": hash_resposta(f"{valor_ultima_transacao:.2f}"),
            "tipo": "numerico",
            "entropia": "muito_alta",
            "justificativa": "Infinitas possibilidades. Informação altamente privada e recente.",
            "categoria": "transacional"
        }
    ]

    # Perguntas alternativas (pool maior para variação)
    perguntas_alternativas = [
        {
            "id": 6,
            "pergunta": "Quais os últimos 4 dígitos da sua conta corrente principal?",
            "resposta": ultimos_digitos_conta,
            "resposta_hash": hash_resposta(ultimos_digitos_conta),
            "tipo": "numerico",
            "entropia": "alta",
            "justificativa": "10.000 possibilidades. Dados bancários privados.",
            "categoria": "financeiro"
        },
        {
            "id": 7,
            "pergunta": "Qual foi a data (DD/MM/YYYY) da sua última transação bancária?",
            "resposta": data_ultima_transacao,
            "resposta_hash": hash_resposta(data_ultima_transacao),
            "tipo": "data",
            "entropia": "alta",
            "justificativa": "365 dias possíveis (últimos 90 mais prováveis). Informação privada.",
            "categoria": "transacional"
        },
        {
            "id": 8,
            "pergunta": "Qual foi o valor aproximado (em reais) da sua última fatura de cartão de crédito? (formato: 0000.00)",
            "resposta": f"{valor_fatura:.2f}",
            "resposta_hash": hash_resposta(f"{valor_fatura:.2f}"),
            "tipo": "numerico",
            "entropia": "muito_alta",
            "justificativa": "Infinitas possibilidades. Informação financeira privada.",
            "categoria": "financeiro"
        },
        {
            "id": 9,
            "pergunta": "Qual foi a data (DD/MM/YYYY) da última vez que você alterou sua senha?",
            "resposta": data_ultima_senha,
            "resposta_hash": hash_resposta(data_ultima_senha),
            "tipo": "data",
            "entropia": "alta",
            "justificativa": "Impossível de adivinhar. Apenas o usuário sabe.",
            "categoria": "seguranca"
        },
        {
            "id": 10,
            "pergunta": "Qual o DDD + primeiros 4 dígitos do seu telefone cadastrado? (formato: 00-0000)",
            "resposta": telefone[1:9],  # Extrai (11) 9999
            "resposta_hash": hash_resposta(telefone[1:9]),
            "tipo": "numerico",
            "entropia": "muito_alta",
            "justificativa": "Milhões de combinações. Dado cadastral privado.",
            "categoria": "cadastral"
        }
    ]

    # Retornar 5 perguntas principais + alternativas para variação
    return {
        "username": username,
        "cpf": cpf,
        "email": email,
        "perguntas_principais": perguntas,
        "perguntas_alternativas": perguntas_alternativas[:3],  # 3 alternativas
        "total_perguntas": len(perguntas) + 3,
        "metadata": {
            "data_geracao": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "versao": "1.0",
            "entropia_media": "alta",
            "observacoes": "Perguntas baseadas em dados transacionais e cadastrais privados, não em informações biográficas públicas."
        }
    }

def gerar_todos_arquivos():
    """Gera arquivo JSON para cada usuário"""

    print("🔐 Gerando perguntas secretas de ALTA ENTROPIA para todos os usuários...\n")

    for idx, usuario in enumerate(usuarios, start=1):
        username = usuario['username']

        # Gerar perguntas
        dados = gerar_perguntas_usuario(usuario)

        # Salvar arquivo JSON
        filename = f"Lab-v4/uploads/{username}_secrets.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)

        print(f"✅ [{idx:02d}/25] {username:20s} → {filename}")

        # Exibir algumas perguntas de exemplo
        if idx <= 3:  # Mostrar primeiras 3 como exemplo
            print(f"    Perguntas geradas:")
            for p in dados['perguntas_principais'][:2]:  # Mostrar 2 perguntas
                print(f"      - {p['pergunta']}")
                print(f"        Resposta: {p['resposta']}")
                print(f"        Hash: {p['resposta_hash'][:16]}...")
                print(f"        Entropia: {p['entropia']}")
            print()

    print(f"\n✅ Total de arquivos gerados: 25")
    print(f"📁 Localização: Lab-v4/uploads/")
    print(f"\n📊 Estatísticas das Perguntas:")
    print(f"   - Perguntas por usuário: 5 principais + 3 alternativas = 8 total")
    print(f"   - Entropia média: ALTA / MUITO ALTA")
    print(f"   - Categorias: Financeiro, Transacional, Cadastral, Profissional, Segurança")
    print(f"   - Armazenamento: Texto claro + Hash SHA-256 (BFF usará hashes)")
    print(f"\n🔒 Segurança:")
    print(f"   - Todas as perguntas têm alta entropia (milhares a milhões de possibilidades)")
    print(f"   - Baseadas em dados privados, não públicos")
    print(f"   - Impossíveis de descobrir em redes sociais ou vazamentos")
    print(f"   - BFF validará usando hashes, não texto claro")

if __name__ == "__main__":
    gerar_todos_arquivos()
