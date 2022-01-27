<?php

use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Extension\SandboxExtension;
use Twig\Markup;
use Twig\Sandbox\SecurityError;
use Twig\Sandbox\SecurityNotAllowedTagError;
use Twig\Sandbox\SecurityNotAllowedFilterError;
use Twig\Sandbox\SecurityNotAllowedFunctionError;
use Twig\Source;
use Twig\Template;

/* themes/newsplus_lite/templates/node--article.html.twig */
class __TwigTemplate_8eb2a15c14c6477dddaadb5076ebbb1be4c6ec03f3942798f0b6bfb59e64523b extends \Twig\Template
{
    private $source;
    private $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->blocks = [
            'node_side' => [$this, 'block_node_side'],
            'meta_area' => [$this, 'block_meta_area'],
        ];
        $this->sandbox = $this->env->getExtension('\Twig\Extension\SandboxExtension');
        $this->checkSecurity();
    }

    protected function doGetParent(array $context)
    {
        // line 65
        return "node.html.twig";
    }

    protected function doDisplay(array $context, array $blocks = [])
    {
        $macros = $this->macros;
        $this->parent = $this->loadTemplate("node.html.twig", "themes/newsplus_lite/templates/node--article.html.twig", 65);
        $this->parent->display($context, array_merge($this->blocks, $blocks));
    }

    // line 66
    public function block_node_side($context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 67
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->extensions['Drupal\Core\Template\TwigExtension']->attachLibrary("newsplus_lite/node-features"), "html", null, true);
        echo "
  <div class=\"node-side\">
    ";
        // line 69
        if (($context["display_submitted"] ?? null)) {
            // line 70
            echo "      <div class=\"user-info\">
        ";
            // line 71
            if (($context["author_picture"] ?? null)) {
                // line 72
                echo "          <div class=\"user-picture\">
            <span";
                // line 73
                echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["author_attributes"] ?? null), 73, $this->source), "html", null, true);
                echo ">
              ";
                // line 74
                echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["author_picture"] ?? null), 74, $this->source), "html", null, true);
                echo "
            </span>
          </div>
        ";
            }
            // line 78
            echo "        <div class=\"user-name\">";
            echo t("By @author_name", array("@author_name" => ($context["author_name"] ?? null), ));
            echo "</div>
        ";
            // line 79
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["metadata"] ?? null), 79, $this->source), "html", null, true);
            echo "
      </div>
    ";
        }
        // line 82
        echo "    <div id=\"affix\">
      <div class=\"submitted-info\">
        <div class=\"submitted-info-item\">
          ";
        // line 85
        echo t("Published", array());
        // line 86
        echo "          <span>";
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["posted_ago"] ?? null), 86, $this->source), "html", null, true);
        echo " ";
        echo t("ago", array());
        echo "</span>
        </div>
        <div class=\"submitted-info-item\">
          ";
        // line 89
        echo t("Last updated", array());
        // line 90
        echo "          <span>";
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["changed_ago"] ?? null), 90, $this->source), "html", null, true);
        echo " ";
        echo t("ago", array());
        echo "</span>
        </div>
      </div>
    </div>
  </div>
";
    }

    // line 96
    public function block_meta_area($context, array $blocks = [])
    {
        $macros = $this->macros;
    }

    public function getTemplateName()
    {
        return "themes/newsplus_lite/templates/node--article.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  121 => 96,  108 => 90,  106 => 89,  97 => 86,  95 => 85,  90 => 82,  84 => 79,  79 => 78,  72 => 74,  68 => 73,  65 => 72,  63 => 71,  60 => 70,  58 => 69,  53 => 67,  49 => 66,  38 => 65,);
    }

    public function getSourceContext()
    {
        return new Source("", "themes/newsplus_lite/templates/node--article.html.twig", "C:\\xampp\\htdocs\\etdevs-dp\\themes\\newsplus_lite\\templates\\node--article.html.twig");
    }
    
    public function checkSecurity()
    {
        static $tags = array("if" => 69, "trans" => 78);
        static $filters = array("escape" => 67);
        static $functions = array("attach_library" => 67);

        try {
            $this->sandbox->checkSecurity(
                ['if', 'trans'],
                ['escape'],
                ['attach_library']
            );
        } catch (SecurityError $e) {
            $e->setSourceContext($this->source);

            if ($e instanceof SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

    }
}
